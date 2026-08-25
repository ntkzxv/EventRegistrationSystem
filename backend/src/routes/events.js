const express = require('express');
const { query } = require('../lib/pg');
const { serializeEventRow, toIsoLocal } = require('../lib/serialize');
const { EVENT_SELECT_SQL } = require('../lib/eventQueries');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

router.get('/events', asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const typeId = req.query.type ? Number(req.query.type) : null;
  const statusFilter = req.query.status ? String(req.query.status) : null;
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const pageSize = req.query.page_size
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.page_size)))
    : DEFAULT_PAGE_SIZE;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`e.name ILIKE $${params.length}`);
  }

  if (typeId) {
    params.push(typeId);
    conditions.push(`e.event_type_id = $${params.length}`);
  }

  if (statusFilter === 'full') {
    conditions.push(`(e.max_seats - COALESCE(rc.confirmed_count, 0)) <= 0`);
  } else if (statusFilter) {
    params.push(statusFilter);
    conditions.push(`e.status = $${params.length}`);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(pageSize);
  const limitParam = `$${params.length}`;
  params.push((page - 1) * pageSize);
  const offsetParam = `$${params.length}`;

  const result = await query(
    `SELECT sub.*, COUNT(*) OVER() AS total_count FROM (
       ${EVENT_SELECT_SQL} ${whereSql}
     ) sub
     ORDER BY sub.id
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    params
  );

  const total = result.rows.length ? Number(result.rows[0].total_count) : 0;

  res.json({
    data: result.rows.map(serializeEventRow),
    total,
    page,
    page_size: pageSize,
  });
}));

router.get('/events/:id', asyncHandler(async (req, res) => {
  const result = await query(`${EVENT_SELECT_SQL} WHERE e.id = $1`, [Number(req.params.id)]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  }

  res.json(serializeEventRow(result.rows[0]));
}));

router.post('/events/:id/register', authenticateToken, asyncHandler(async (req, res) => {
  const eventId = Number(req.params.id);

  const eventResult = await query('SELECT * FROM events WHERE id = $1', [eventId]);
  const event = eventResult.rows[0];

  if (!event) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  }

  if (event.status !== 'open') {
    return res.status(409).json({ success: false, message: 'กิจกรรมนี้ปิดรับสมัครแล้ว' });
  }

  const existing = await query(
    `SELECT id FROM registrations WHERE event_id = $1 AND user_id = $2 AND status != 'cancelled'`,
    [eventId, req.user.id]
  );

  if (existing.rows.length > 0) {
    return res.status(409).json({ success: false, message: 'คุณได้สมัครกิจกรรมนี้ไปแล้ว ไม่สามารถสมัครซ้ำได้' });
  }

  const confirmedCountResult = await query(
    `SELECT COUNT(*) AS count FROM registrations WHERE event_id = $1 AND status = 'confirmed'`,
    [eventId]
  );

  if (Number(confirmedCountResult.rows[0].count) >= event.max_seats) {
    return res.status(409).json({ success: false, message: 'ที่นั่งเต็มแล้ว' });
  }

  const insertResult = await query(
    `INSERT INTO registrations (event_id, user_id, status, registered_at)
     VALUES ($1, $2, 'confirmed', now())
     RETURNING id, status`,
    [eventId, req.user.id]
  );

  res.status(200).json({
    success: true,
    registration: { id: insertResult.rows[0].id, status: insertResult.rows[0].status },
  });
}));

router.delete('/events/:id/register', authenticateToken, asyncHandler(async (req, res) => {
  const eventId = Number(req.params.id);

  const result = await query(
    `UPDATE registrations
     SET status = 'cancelled', cancelled_at = now()
     WHERE id = (
       SELECT id FROM registrations
       WHERE event_id = $1 AND user_id = $2 AND status != 'cancelled'
       ORDER BY id DESC
       LIMIT 1
     )
     RETURNING id`,
    [eventId, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบการสมัครกิจกรรมนี้' });
  }

  res.status(200).json({ success: true, message: 'ยกเลิกการสมัครสำเร็จ' });
}));

router.get('/users/me/registrations', authenticateToken, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT r.id, r.status, r.registered_at, r.cancelled_at,
            e.id AS event_id, e.name AS event_name, e.start_date AS event_start_date,
            v.name AS venue_name
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     LEFT JOIN venues v ON v.id = e.venue_id
     WHERE r.user_id = $1
     ORDER BY r.id DESC`,
    [req.user.id]
  );

  const data = result.rows.map((row) => ({
    id: row.id,
    event: {
      id: row.event_id,
      name: row.event_name,
      start_date: toIsoLocal(row.event_start_date),
      venue: row.venue_name ? { name: row.venue_name } : null,
    },
    status: row.status,
    registered_at: toIsoLocal(row.registered_at),
    cancelled_at: toIsoLocal(row.cancelled_at),
  }));

  res.json({ data });
}));

module.exports = router;

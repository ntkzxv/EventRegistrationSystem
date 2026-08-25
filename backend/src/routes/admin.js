const express = require('express');
const { query } = require('../lib/pg');
const { serializeEventRow, toIsoLocal } = require('../lib/serialize');
const { EVENT_SELECT_SQL } = require('../lib/eventQueries');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// ---------- Events ----------

router.post('/events', asyncHandler(async (req, res) => {
  const body = req.body || {};

  const result = await query(
    `INSERT INTO events (
       name, description, event_type_id, venue_id,
       organizer_name, organizer_contact_email, organizer_contact_phone,
       start_date, end_date, max_seats, status, created_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [
      body.name || '',
      body.description || '',
      Number(body.event_type_id) || 1,
      Number(body.venue_id) || 1,
      body.organizer_name || 'EventHub Organizer',
      body.organizer_contact_email || req.user?.email || 'admin@eventhub.com',
      body.organizer_contact_phone || '02-123-4567',
      body.start_date,
      body.end_date,
      Number(body.max_seats) || 100,
      body.status || 'open',
      req.user.id,
    ]
  );

  const eventRow = await query(`${EVENT_SELECT_SQL} WHERE e.id = $1`, [result.rows[0].id]);

  res.status(201).json(serializeEventRow(eventRow.rows[0]));
}));

router.put('/events/:id', asyncHandler(async (req, res) => {
  const eventId = Number(req.params.id);

  const fields = [
    'name', 'description', 'event_type_id', 'venue_id',
    'organizer_name', 'organizer_contact_email', 'organizer_contact_phone',
    'start_date', 'end_date', 'max_seats', 'status',
  ];

  const setClauses = [];
  const params = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      const value = ['event_type_id', 'venue_id', 'max_seats'].includes(field)
        ? Number(req.body[field])
        : req.body[field];
      params.push(value);
      setClauses.push(`${field} = $${params.length}`);
    }
  }

  if (setClauses.length === 0) {
    const existing = await query(`${EVENT_SELECT_SQL} WHERE e.id = $1`, [eventId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
    }
    return res.json(serializeEventRow(existing.rows[0]));
  }

  setClauses.push('updated_at = now()');
  params.push(eventId);

  const updateResult = await query(
    `UPDATE events SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING id`,
    params
  );

  if (updateResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  }

  const eventRow = await query(`${EVENT_SELECT_SQL} WHERE e.id = $1`, [eventId]);
  res.json(serializeEventRow(eventRow.rows[0]));
}));

router.delete('/events/:id', asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM events WHERE id = $1 RETURNING id', [
    Number(req.params.id),
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  }

  res.json({ success: true });
}));

router.patch('/events/:id/status', asyncHandler(async (req, res) => {
  const result = await query(
    'UPDATE events SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, status',
    [req.body.status, Number(req.params.id)]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  }

  res.json({ id: result.rows[0].id, status: result.rows[0].status });
}));

router.get('/events/:id/registrants', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT r.id, r.status, r.registered_at, r.cancelled_at, u.name AS user_name, u.email AS user_email
     FROM registrations r
     JOIN users u ON u.id = r.user_id
     WHERE r.event_id = $1
     ORDER BY r.id`,
    [Number(req.params.id)]
  );

  const data = result.rows.map((r) => ({
    id: r.id,
    user: { name: r.user_name, email: r.user_email },
    status: r.status,
    registered_at: toIsoLocal(r.registered_at),
    cancelled_at: toIsoLocal(r.cancelled_at),
  }));

  res.json({ data, total: data.length });
}));

// ---------- Venues ----------

router.get('/venues', asyncHandler(async (req, res) => {
  const result = await query('SELECT id, name, address, capacity FROM venues ORDER BY id');
  res.json({ data: result.rows });
}));

router.post('/venues', asyncHandler(async (req, res) => {
  const { name, address, capacity } = req.body || {};

  const result = await query(
    `INSERT INTO venues (name, address, capacity) VALUES ($1, $2, $3)
     RETURNING id, name, address, capacity`,
    [name, address || '', Number(capacity) || 0]
  );

  res.status(201).json(result.rows[0]);
}));

router.put('/venues/:id', asyncHandler(async (req, res) => {
  const venueId = Number(req.params.id);
  const { name, address, capacity } = req.body || {};

  const fields = [];
  const params = [];

  if (name !== undefined) { params.push(name); fields.push(`name = $${params.length}`); }
  if (address !== undefined) { params.push(address); fields.push(`address = $${params.length}`); }
  if (capacity !== undefined) { params.push(Number(capacity)); fields.push(`capacity = $${params.length}`); }

  if (fields.length === 0) {
    const existing = await query('SELECT id, name, address, capacity FROM venues WHERE id = $1', [venueId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบสถานที่' });
    }
    return res.json(existing.rows[0]);
  }

  params.push(venueId);

  const result = await query(
    `UPDATE venues SET ${fields.join(', ')} WHERE id = $${params.length}
     RETURNING id, name, address, capacity`,
    params
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบสถานที่' });
  }

  res.json(result.rows[0]);
}));

router.delete('/venues/:id', asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM venues WHERE id = $1 RETURNING id', [
    Number(req.params.id),
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบสถานที่' });
  }

  res.json({ success: true });
}));

// ---------- Event types ----------

router.get('/event-types', asyncHandler(async (req, res) => {
  const result = await query('SELECT id, name, badge_color FROM event_types ORDER BY id');
  res.json({ data: result.rows });
}));

router.post('/event-types', asyncHandler(async (req, res) => {
  const { name, badge_color } = req.body || {};

  const result = await query(
    `INSERT INTO event_types (name, badge_color) VALUES ($1, $2)
     RETURNING id, name, badge_color`,
    [name, badge_color || null]
  );

  res.status(201).json(result.rows[0]);
}));

// ---------- Dashboard ----------

router.get('/dashboard', asyncHandler(async (req, res) => {
  const totalsResult = await query(`
    SELECT
      (SELECT COUNT(*) FROM registrations WHERE status != 'cancelled') AS total_registrations,
      (SELECT COUNT(*) FROM events) AS total_events,
      (SELECT COUNT(*) FROM events WHERE status = 'open') AS open_events,
      (SELECT COUNT(*) FROM events WHERE status = 'closed') AS closed_events
  `);

  const recentResult = await query(`
    SELECT r.status, r.registered_at, u.name AS user_name, e.name AS event_name
    FROM registrations r
    JOIN users u ON u.id = r.user_id
    JOIN events e ON e.id = r.event_id
    ORDER BY r.registered_at DESC
    LIMIT 10
  `);

  const totals = totalsResult.rows[0];

  res.json({
    total_registrations: Number(totals.total_registrations),
    total_events: Number(totals.total_events),
    open_events: Number(totals.open_events),
    closed_events: Number(totals.closed_events),
    recent_registrations: recentResult.rows.map((r) => ({
      user_name: r.user_name,
      event_name: r.event_name,
      registered_at: toIsoLocal(r.registered_at),
      status: r.status,
    })),
  });
}));

module.exports = router;

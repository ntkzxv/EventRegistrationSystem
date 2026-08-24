const express = require('express');
const { readDb, writeDb, nextId } = require('../lib/db');
const { serializeEventSummary, serializeEventDetail } = require('../lib/serialize');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const PAGE_SIZE = 100;

router.get('/events', (req, res) => {
  const db = readDb();
  const search = String(req.query.search || '').trim().toLowerCase();
  const typeId = req.query.type ? Number(req.query.type) : null;
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;

  let events = db.events.filter((event) => {
    const matchesSearch = !search || event.name.toLowerCase().includes(search);
    const matchesType = !typeId || event.event_type_id === typeId;
    return matchesSearch && matchesType;
  });

  const total = events.length;
  const start = (page - 1) * PAGE_SIZE;
  const pageEvents = events.slice(start, start + PAGE_SIZE);

  res.json({
    data: pageEvents.map((event) => serializeEventSummary(db, event)),
    total,
    page,
  });
});

router.get('/events/:id', (req, res) => {
  const db = readDb();
  const event = db.events.find((e) => e.id === Number(req.params.id));

  if (!event) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  }

  res.json(serializeEventDetail(db, event));
});

router.post('/events/:id/register', authenticateToken, (req, res) => {
  const db = readDb();
  const eventId = Number(req.params.id);
  const event = db.events.find((e) => e.id === eventId);

  if (!event) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  }

  if (event.status !== 'open') {
    return res.status(409).json({ success: false, message: 'กิจกรรมนี้ปิดรับสมัครแล้ว' });
  }

  const existing = db.registrations.find(
    (r) => r.event_id === eventId && r.user_id === req.user.id && r.status !== 'cancelled'
  );

  if (existing) {
    return res.status(409).json({ success: false, message: 'คุณสมัครกิจกรรมนี้ไว้แล้ว' });
  }

  const confirmedCount = db.registrations.filter(
    (r) => r.event_id === eventId && r.status === 'confirmed'
  ).length;

  if (confirmedCount >= event.max_seats) {
    return res.status(409).json({ success: false, message: 'ที่นั่งเต็มแล้ว' });
  }

  const registration = {
    id: nextId(db, 'nextRegistrationId'),
    event_id: eventId,
    user_id: req.user.id,
    status: 'confirmed',
    registered_at: new Date().toISOString(),
  };

  db.registrations.push(registration);
  writeDb(db);

  res.status(200).json({
    success: true,
    registration: { id: registration.id, status: registration.status },
  });
});

router.delete('/events/:id/register', authenticateToken, (req, res) => {
  const db = readDb();
  const eventId = Number(req.params.id);

  const registration = db.registrations.find(
    (r) => r.event_id === eventId && r.user_id === req.user.id && r.status !== 'cancelled'
  );

  if (!registration) {
    return res.status(404).json({ success: false, message: 'ไม่พบการสมัครกิจกรรมนี้' });
  }

  registration.status = 'cancelled';
  writeDb(db);

  res.status(200).json({ success: true, message: 'ยกเลิกการสมัครสำเร็จ' });
});

router.get('/users/me/registrations', authenticateToken, (req, res) => {
  const db = readDb();

  const data = db.registrations
    .filter((r) => r.user_id === req.user.id)
    .slice()
    .reverse()
    .map((r) => {
      const event = db.events.find((e) => e.id === r.event_id);
      const venue = event ? db.venues.find((v) => v.id === event.venue_id) : null;

      return {
        id: r.id,
        event: event && {
          id: event.id,
          name: event.name,
          start_date: event.start_date,
          venue: venue && { name: venue.name },
        },
        status: r.status,
        registered_at: r.registered_at,
      };
    })
    .filter((r) => r.event);

  res.json({ data });
});

module.exports = router;

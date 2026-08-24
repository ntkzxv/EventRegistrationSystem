const express = require('express');
const { readDb, writeDb, nextId } = require('../lib/db');
const { serializeEventDetail } = require('../lib/serialize');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// ---------- Events ----------

router.post('/events', (req, res) => {
  const db = readDb();
  const body = req.body || {};

  const event = {
    id: nextId(db, 'nextEventId'),
    name: body.name,
    description: body.description,
    event_type_id: Number(body.event_type_id),
    venue_id: Number(body.venue_id),
    organizer_name: body.organizer_name,
    organizer_contact_email: body.organizer_contact_email,
    organizer_contact_phone: body.organizer_contact_phone,
    start_date: body.start_date,
    end_date: body.end_date,
    max_seats: Number(body.max_seats),
    status: 'open',
  };

  db.events.push(event);
  writeDb(db);

  res.status(201).json(serializeEventDetail(db, event));
});

router.put('/events/:id', (req, res) => {
  const db = readDb();
  const event = db.events.find((e) => e.id === Number(req.params.id));

  if (!event) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  }

  const fields = [
    'name', 'description', 'event_type_id', 'venue_id',
    'organizer_name', 'organizer_contact_email', 'organizer_contact_phone',
    'start_date', 'end_date', 'max_seats', 'status',
  ];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      const value = req.body[field];
      event[field] = ['event_type_id', 'venue_id', 'max_seats'].includes(field)
        ? Number(value)
        : value;
    }
  }

  writeDb(db);

  res.json(serializeEventDetail(db, event));
});

router.delete('/events/:id', (req, res) => {
  const db = readDb();
  const eventId = Number(req.params.id);
  const index = db.events.findIndex((e) => e.id === eventId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  }

  db.events.splice(index, 1);
  db.registrations = db.registrations.filter((r) => r.event_id !== eventId);
  writeDb(db);

  res.json({ success: true });
});

router.patch('/events/:id/status', (req, res) => {
  const db = readDb();
  const event = db.events.find((e) => e.id === Number(req.params.id));

  if (!event) {
    return res.status(404).json({ success: false, message: 'ไม่พบกิจกรรม' });
  }

  event.status = req.body.status;
  writeDb(db);

  res.json({ id: event.id, status: event.status });
});

router.get('/events/:id/registrants', (req, res) => {
  const db = readDb();
  const eventId = Number(req.params.id);

  const registrants = db.registrations.filter((r) => r.event_id === eventId);

  const data = registrants.map((r) => {
    const user = db.users.find((u) => u.id === r.user_id);
    return {
      id: r.id,
      user: user && { name: user.name, email: user.email },
      status: r.status,
      registered_at: r.registered_at,
    };
  });

  res.json({ data, total: data.length });
});

// ---------- Venues ----------

router.get('/venues', (req, res) => {
  const db = readDb();
  res.json({ data: db.venues });
});

router.post('/venues', (req, res) => {
  const db = readDb();
  const { name, address, capacity } = req.body || {};

  const venue = { id: nextId(db, 'nextVenueId'), name, address, capacity: Number(capacity) };
  db.venues.push(venue);
  writeDb(db);

  res.status(201).json(venue);
});

router.put('/venues/:id', (req, res) => {
  const db = readDb();
  const venue = db.venues.find((v) => v.id === Number(req.params.id));

  if (!venue) {
    return res.status(404).json({ success: false, message: 'ไม่พบสถานที่' });
  }

  const { name, address, capacity } = req.body || {};
  if (name !== undefined) venue.name = name;
  if (address !== undefined) venue.address = address;
  if (capacity !== undefined) venue.capacity = Number(capacity);

  writeDb(db);

  res.json(venue);
});

router.delete('/venues/:id', (req, res) => {
  const db = readDb();
  const venueId = Number(req.params.id);
  const index = db.venues.findIndex((v) => v.id === venueId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบสถานที่' });
  }

  db.venues.splice(index, 1);
  writeDb(db);

  res.json({ success: true });
});

// ---------- Event types ----------

router.get('/event-types', (req, res) => {
  const db = readDb();
  res.json({ data: db.event_types });
});

router.post('/event-types', (req, res) => {
  const db = readDb();
  const { name, badge_color } = req.body || {};

  const eventType = { id: nextId(db, 'nextEventTypeId'), name, badge_color };
  db.event_types.push(eventType);
  writeDb(db);

  res.status(201).json(eventType);
});

// ---------- Dashboard ----------

router.get('/dashboard', (req, res) => {
  const db = readDb();

  const totalRegistrations = db.registrations.filter((r) => r.status !== 'cancelled').length;
  const totalEvents = db.events.length;
  const openEvents = db.events.filter((e) => e.status === 'open').length;
  const closedEvents = db.events.filter((e) => e.status === 'closed').length;

  const recentRegistrations = db.registrations
    .slice()
    .sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at))
    .slice(0, 10)
    .map((r) => {
      const user = db.users.find((u) => u.id === r.user_id);
      const event = db.events.find((e) => e.id === r.event_id);
      return {
        user_name: user ? user.name : '',
        event_name: event ? event.name : '',
        registered_at: r.registered_at,
        status: r.status,
      };
    });

  res.json({
    total_registrations: totalRegistrations,
    total_events: totalEvents,
    open_events: openEvents,
    closed_events: closedEvents,
    recent_registrations: recentRegistrations,
  });
});

module.exports = router;

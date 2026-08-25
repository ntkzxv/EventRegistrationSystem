const EVENT_SELECT_SQL = `
  SELECT
    e.id, e.name, e.description, e.start_date, e.end_date, e.max_seats, e.status,
    e.organizer_name, e.organizer_contact_email, e.organizer_contact_phone,
    e.created_by, e.created_at, e.updated_at,
    et.id AS event_type_id, et.name AS event_type_name, et.badge_color AS event_type_badge_color,
    v.id AS venue_id, v.name AS venue_name, v.address AS venue_address, v.capacity AS venue_capacity,
    e.max_seats - COALESCE(rc.confirmed_count, 0) AS seats_remaining
  FROM events e
  LEFT JOIN event_types et ON et.id = e.event_type_id
  LEFT JOIN venues v ON v.id = e.venue_id
  LEFT JOIN (
    SELECT event_id, COUNT(*) AS confirmed_count
    FROM registrations
    WHERE status = 'confirmed'
    GROUP BY event_id
  ) rc ON rc.event_id = e.id
`;

module.exports = { EVENT_SELECT_SQL };

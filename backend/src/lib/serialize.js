function getSeatsRemaining(db, event) {
  const confirmedCount = db.registrations.filter(
    (r) => r.event_id === event.id && r.status === 'confirmed'
  ).length;

  return Math.max(0, event.max_seats - confirmedCount);
}

function serializeEventSummary(db, event) {
  const eventType = db.event_types.find((t) => t.id === event.event_type_id) || null;
  const venue = db.venues.find((v) => v.id === event.venue_id) || null;

  return {
    id: event.id,
    name: event.name,
    description: event.description || '',
    event_type: eventType && { id: eventType.id, name: eventType.name, badge_color: eventType.badge_color },
    venue: venue && { id: venue.id, name: venue.name, address: venue.address || '', capacity: venue.capacity || 0 },
    organizer_name: event.organizer_name || '',
    organizer_contact_email: event.organizer_contact_email || '',
    organizer_contact_phone: event.organizer_contact_phone || '',
    start_date: event.start_date,
    end_date: event.end_date,
    max_seats: event.max_seats,
    seats_remaining: getSeatsRemaining(db, event),
    status: event.status,
    created_by: event.created_by,
    created_at: event.created_at,
    updated_at: event.updated_at,
  };
}

function serializeEventDetail(db, event) {
  const eventType = db.event_types.find((t) => t.id === event.event_type_id) || null;
  const venue = db.venues.find((v) => v.id === event.venue_id) || null;

  return {
    id: event.id,
    name: event.name,
    description: event.description,
    event_type: eventType && { id: eventType.id, name: eventType.name, badge_color: eventType.badge_color },
    venue: venue && { id: venue.id, name: venue.name, address: venue.address || '', capacity: venue.capacity || 0 },
    organizer_name: event.organizer_name,
    organizer_contact_email: event.organizer_contact_email,
    organizer_contact_phone: event.organizer_contact_phone,
    start_date: event.start_date,
    end_date: event.end_date,
    max_seats: event.max_seats,
    seats_remaining: getSeatsRemaining(db, event),
    status: event.status,
  };
}

module.exports = { getSeatsRemaining, serializeEventSummary, serializeEventDetail };

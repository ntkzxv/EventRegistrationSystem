function toIsoLocal(pgTimestamp) {
  if (!pgTimestamp) return pgTimestamp;
  return String(pgTimestamp).replace(' ', 'T').split('.')[0];
}

// row มาจาก query ที่ JOIN events กับ event_types + venues แล้ว
// (ดู EVENT_SELECT_SQL ใน routes/events.js และ routes/admin.js)
function serializeEventRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    event_type: row.event_type_id
      ? { id: row.event_type_id, name: row.event_type_name, badge_color: row.event_type_badge_color }
      : null,
    venue: row.venue_id
      ? {
          id: row.venue_id,
          name: row.venue_name,
          address: row.venue_address || '',
          capacity: row.venue_capacity || 0,
        }
      : null,
    organizer_name: row.organizer_name || '',
    organizer_contact_email: row.organizer_contact_email || '',
    organizer_contact_phone: row.organizer_contact_phone || '',
    start_date: toIsoLocal(row.start_date),
    end_date: toIsoLocal(row.end_date),
    max_seats: row.max_seats,
    seats_remaining: Math.max(0, Number(row.seats_remaining)),
    status: row.status,
    created_by: row.created_by,
    created_at: toIsoLocal(row.created_at),
    updated_at: toIsoLocal(row.updated_at),
  };
}

module.exports = { toIsoLocal, serializeEventRow };

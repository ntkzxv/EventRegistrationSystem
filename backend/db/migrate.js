require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(schema);
  console.log('Schema created.');

  const db = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'db.json'), 'utf-8')
  );

  for (const u of db.users) {
    await pool.query(
      `INSERT INTO users (id, name, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [u.id, u.name, u.email, u.password, u.role]
    );
  }
  console.log(`Imported ${db.users.length} users.`);

  for (const t of db.event_types) {
    await pool.query(
      `INSERT INTO event_types (id, name, badge_color)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [t.id, t.name, t.badge_color || null]
    );
  }
  console.log(`Imported ${db.event_types.length} event_types.`);

  for (const v of db.venues) {
    await pool.query(
      `INSERT INTO venues (id, name, address, capacity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [v.id, v.name, v.address || '', v.capacity || 0]
    );
  }
  console.log(`Imported ${db.venues.length} venues.`);

  for (const e of db.events) {
    await pool.query(
      `INSERT INTO events (
         id, name, description, event_type_id, venue_id,
         organizer_name, organizer_contact_email, organizer_contact_phone,
         start_date, end_date, max_seats, status, created_by, created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (id) DO NOTHING`,
      [
        e.id,
        e.name,
        e.description || '',
        e.event_type_id,
        e.venue_id,
        e.organizer_name || '',
        e.organizer_contact_email || '',
        e.organizer_contact_phone || '',
        e.start_date,
        e.end_date,
        e.max_seats,
        e.status === 'full' ? 'open' : e.status,
        e.created_by || null,
        e.created_at || new Date().toISOString(),
        e.updated_at || new Date().toISOString(),
      ]
    );
  }
  console.log(`Imported ${db.events.length} events.`);

  for (const r of db.registrations) {
    await pool.query(
      `INSERT INTO registrations (id, event_id, user_id, status, registered_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.event_id, r.user_id, r.status, r.registered_at]
    );
  }
  console.log(`Imported ${db.registrations.length} registrations.`);

  // sync sequences ให้ต่อจาก id สูงสุดที่มีอยู่ ไม่งั้น insert ใหม่จะชนกับของเดิม
  const tables = ['users', 'event_types', 'venues', 'events', 'registrations'];
  for (const t of tables) {
    await pool.query(
      `SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 1))`
    );
  }
  console.log('Sequences synced.');

  await pool.end();
  console.log('Done.');
}

run().catch((err) => {
  console.error('MIGRATION FAILED:', err);
  process.exit(1);
});

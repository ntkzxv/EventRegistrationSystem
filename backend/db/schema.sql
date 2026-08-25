-- Event Registration System — schema for Supabase (Postgres)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

CREATE TABLE IF NOT EXISTS event_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  badge_color TEXT
);

CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  capacity INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_type_id INTEGER REFERENCES event_types(id),
  venue_id INTEGER REFERENCES venues(id),
  organizer_name TEXT DEFAULT '',
  organizer_contact_email TEXT DEFAULT '',
  organizer_contact_phone TEXT DEFAULT '',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  max_seats INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'full', 'draft')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  registered_at TIMESTAMP NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'db.json');

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(db, counterKey) {
  const id = db._meta[counterKey];
  db._meta[counterKey] = id + 1;
  return id;
}

module.exports = { readDb, writeDb, nextId };

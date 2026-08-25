const { Pool, types } = require('pg');

// เก็บ timestamp เป็น string ดิบ (ไม่แปลงเป็น Date object) เพื่อไม่ให้ node-pg
// แปลงเวลาแบบ naive local ของเราให้เพี้ยนเป็น UTC ตอน serialize กลับเป็น JSON
types.setTypeParser(1114, (str) => str); // timestamp without time zone
types.setTypeParser(1082, (str) => str); // date

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };

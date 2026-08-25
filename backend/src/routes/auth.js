const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../lib/pg');
const { JWT_SECRET } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const existing = await query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);

  if (existing.rows.length > 0) {
    return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้แล้ว' });
  }

  const hashed = bcrypt.hashSync(password, 10);

  const result = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'user')
     RETURNING id, name, email, role`,
    [name, email, hashed]
  );

  res.status(201).json(result.rows[0]);
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  const result = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [
    email || '',
  ]);

  const user = result.rows[0];
  const passwordMatches = user && bcrypt.compareSync(password || '', user.password);

  if (!user || !passwordMatches) {
    return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(200).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}));

module.exports = router;

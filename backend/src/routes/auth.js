const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDb, writeDb, nextId } = require('../lib/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const db = readDb();
  const emailTaken = db.users.some(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );

  if (emailTaken) {
    return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้แล้ว' });
  }

  const user = {
    id: nextId(db, 'nextUserId'),
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    role: 'user',
  };

  db.users.push(user);
  writeDb(db);

  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  const db = readDb();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === String(email || '').toLowerCase()
  );

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
});

module.exports = router;

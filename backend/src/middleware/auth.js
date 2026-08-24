const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'event-registration-dev-secret';

function authenticateToken(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'ต้องเข้าสู่ระบบก่อนใช้งาน' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'โทเคนไม่ถูกต้องหรือหมดอายุ' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'ต้องเป็นผู้ดูแลระบบเท่านั้น' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };

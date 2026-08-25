require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const eventsRoutes = require('./src/routes/events');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', eventsRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'ไม่พบ endpoint นี้' });
});

app.listen(PORT, () => {
  console.log(`Event Registration API listening on http://localhost:${PORT}`);
});

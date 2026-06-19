const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/app', express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.json({ message: 'Student Attendance Management System backend is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/attendance', attendanceRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing process or free the port, then restart.`);
    process.exit(1);
  }

  console.error('Server failed to start:', err.message);
  process.exit(1);
});

const express = require('express');
const jwt = require('jsonwebtoken');
const { get, all, run } = require('../db');

const router = express.Router();
const JWT_SECRET = 'skillhive_jwt_secret';
const VALID_STATUSES = new Set(['present', 'absent', 'late']);

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Missing or invalid token.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

router.get('/students', authenticate, async (req, res) => {
  try {
    const { className = '' } = req.query;
    const trimmedClass = String(className).trim();

    const rows = trimmedClass
      ? await all(
        'SELECT * FROM students WHERE className = ? ORDER BY rollNo COLLATE NOCASE',
        [trimmedClass]
      )
      : await all('SELECT * FROM students ORDER BY className COLLATE NOCASE, rollNo COLLATE NOCASE');

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/students', authenticate, async (req, res) => {
  try {
    const rollNo = String(req.body.rollNo || '').trim();
    const name = String(req.body.name || '').trim();
    const className = String(req.body.className || '').trim();
    const email = String(req.body.email || '').trim();

    if (!rollNo || !name || !className) {
      return res.status(400).json({ message: 'Roll number, name, and class are required.' });
    }

    const result = await run(
      'INSERT INTO students (rollNo, name, className, email) VALUES (?, ?, ?, ?)',
      [rollNo, name, className, email]
    );

    const student = await get('SELECT * FROM students WHERE id = ?', [result.id]);
    return res.status(201).json(student);
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ message: 'A student with this roll number already exists.' });
    }

    return res.status(500).json({ message: err.message });
  }
});

router.get('/records', authenticate, async (req, res) => {
  try {
    const attendanceDate = String(req.query.date || '').trim();
    const className = String(req.query.className || '').trim();

    if (!isValidDate(attendanceDate)) {
      return res.status(400).json({ message: 'A valid date is required.' });
    }

    const params = [attendanceDate];
    let classFilter = '';

    if (className) {
      classFilter = 'WHERE s.className = ?';
      params.unshift(className);
    }

    const rows = await all(
      `
        SELECT
          s.id AS studentId,
          s.rollNo,
          s.name,
          s.className,
          s.email,
          a.id AS attendanceId,
          a.attendanceDate,
          COALESCE(a.status, 'absent') AS status,
          COALESCE(a.remarks, '') AS remarks
        FROM students s
        LEFT JOIN attendance a
          ON a.studentId = s.id AND a.attendanceDate = ?
        ${classFilter}
        ORDER BY s.className COLLATE NOCASE, s.rollNo COLLATE NOCASE
      `,
      className ? [attendanceDate, className] : [attendanceDate]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/records', authenticate, async (req, res) => {
  try {
    const attendanceDate = String(req.body.date || '').trim();
    const records = Array.isArray(req.body.records) ? req.body.records : [];

    if (!isValidDate(attendanceDate)) {
      return res.status(400).json({ message: 'A valid attendance date is required.' });
    }

    if (!records.length) {
      return res.status(400).json({ message: 'At least one attendance record is required.' });
    }

    for (const record of records) {
      const studentId = Number(record.studentId);
      const status = String(record.status || '').trim().toLowerCase();
      const remarks = String(record.remarks || '').trim();

      if (!Number.isInteger(studentId) || studentId <= 0 || !VALID_STATUSES.has(status)) {
        return res.status(400).json({ message: 'Each record needs a valid student and status.' });
      }

      const student = await get('SELECT id FROM students WHERE id = ?', [studentId]);
      if (!student) {
        return res.status(404).json({ message: `Student ${studentId} was not found.` });
      }

      await run(
        `
          INSERT INTO attendance (studentId, attendanceDate, status, remarks, markedBy)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(studentId, attendanceDate)
          DO UPDATE SET
            status = excluded.status,
            remarks = excluded.remarks,
            markedBy = excluded.markedBy,
            updatedAt = CURRENT_TIMESTAMP
        `,
        [studentId, attendanceDate, status, remarks, req.user.id]
      );
    }

    return res.json({ message: 'Attendance saved.', count: records.length });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/summary', authenticate, async (req, res) => {
  try {
    const className = String(req.query.className || '').trim();
    const params = [];
    const filter = className ? 'WHERE s.className = ?' : '';

    if (className) {
      params.push(className);
    }

    const rows = await all(
      `
        SELECT
          s.id,
          s.rollNo,
          s.name,
          s.className,
          COUNT(a.id) AS totalMarked,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS presentCount,
          SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absentCount,
          SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS lateCount
        FROM students s
        LEFT JOIN attendance a ON a.studentId = s.id
        ${filter}
        GROUP BY s.id
        ORDER BY s.className COLLATE NOCASE, s.rollNo COLLATE NOCASE
      `,
      params
    );

    return res.json(rows.map((row) => ({
      ...row,
      totalMarked: row.totalMarked || 0,
      presentCount: row.presentCount || 0,
      absentCount: row.absentCount || 0,
      lateCount: row.lateCount || 0,
      percentage: row.totalMarked
        ? Math.round(((row.presentCount + row.lateCount) / row.totalMarked) * 100)
        : 0,
    })));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;

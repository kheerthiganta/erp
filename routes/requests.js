const express = require('express');
const jwt = require('jsonwebtoken');
const { get, all, run } = require('../db');

const router = express.Router();
const JWT_SECRET = 'skillhive_jwt_secret';

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

router.post('/', authenticate, async (req, res) => {
  try {
    const { receiverId, skill } = req.body;
    const parsedReceiverId = Number(receiverId);
    const normalizedSkill = String(skill || '').trim();

    if (!Number.isInteger(parsedReceiverId) || parsedReceiverId <= 0 || !normalizedSkill) {
      return res.status(400).json({ message: 'Valid receiverId and skill are required.' });
    }

    if (parsedReceiverId === req.user.id) {
      return res.status(400).json({ message: 'You cannot send a request to yourself.' });
    }

    const receiver = await get('SELECT id FROM users WHERE id = ?', [parsedReceiverId]);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found.' });
    }

    const result = await run(
      'INSERT INTO requests (senderId, receiverId, skill, status) VALUES (?, ?, ?, ?)',
      [req.user.id, parsedReceiverId, normalizedSkill, 'pending']
    );

    const createdRequest = await get('SELECT * FROM requests WHERE id = ?', [result.id]);
    return res.status(201).json(createdRequest);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const sent = await all(
      `
        SELECT
          r.id, r.senderId, r.receiverId, r.skill, r.status, r.createdAt,
          u.name AS receiverName, u.email AS receiverEmail
        FROM requests r
        JOIN users u ON r.receiverId = u.id
        WHERE r.senderId = ?
        ORDER BY r.createdAt DESC
      `,
      [req.user.id]
    );

    const received = await all(
      `
        SELECT
          r.id, r.senderId, r.receiverId, r.skill, r.status, r.createdAt,
          u.name AS senderName, u.email AS senderEmail
        FROM requests r
        JOIN users u ON r.senderId = u.id
        WHERE r.receiverId = ?
        ORDER BY r.createdAt DESC
      `,
      [req.user.id]
    );

    return res.json({ sent, received });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

async function changeRequestStatus(req, res, status) {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ message: 'Invalid request id.' });
    }

    const requestItem = await get('SELECT * FROM requests WHERE id = ?', [requestId]);
    if (!requestItem) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (requestItem.receiverId !== req.user.id) {
      return res.status(403).json({ message: 'Only the receiver can update this request.' });
    }

    if (requestItem.status !== 'pending') {
      return res.status(400).json({ message: 'This request is already resolved.' });
    }

    await run('UPDATE requests SET status = ? WHERE id = ?', [status, requestId]);
    const updatedRequest = await get('SELECT * FROM requests WHERE id = ?', [requestId]);
    return res.json(updatedRequest);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

router.post('/:id/accept', authenticate, (req, res) => changeRequestStatus(req, res, 'accepted'));
router.post('/:id/reject', authenticate, (req, res) => changeRequestStatus(req, res, 'rejected'));

module.exports = router;

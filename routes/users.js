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

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }
  return skills.map((skill) => String(skill).trim()).filter(Boolean);
}

function parseSkills(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function formatUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    skillsOffered: parseSkills(row.skillsOffered),
    skillsWanted: parseSkills(row.skillsWanted),
  };
}

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await get(
      'SELECT id, name, email, skillsOffered, skillsWanted FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json(formatUser(user));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const { skillsOffered, skillsWanted } = req.body;

    if (skillsOffered !== undefined && !Array.isArray(skillsOffered)) {
      return res.status(400).json({ message: 'skillsOffered must be an array.' });
    }

    if (skillsWanted !== undefined && !Array.isArray(skillsWanted)) {
      return res.status(400).json({ message: 'skillsWanted must be an array.' });
    }

    const user = await get(
      'SELECT id, name, email, skillsOffered, skillsWanted FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const nextOffered = skillsOffered !== undefined
      ? normalizeSkills(skillsOffered)
      : parseSkills(user.skillsOffered);

    const nextWanted = skillsWanted !== undefined
      ? normalizeSkills(skillsWanted)
      : parseSkills(user.skillsWanted);

    await run(
      'UPDATE users SET skillsOffered = ?, skillsWanted = ? WHERE id = ?',
      [JSON.stringify(nextOffered), JSON.stringify(nextWanted), req.user.id]
    );

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      skillsOffered: nextOffered,
      skillsWanted: nextWanted,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { skill } = req.query;

    const rows = await all(
      'SELECT id, name, email, skillsOffered, skillsWanted FROM users ORDER BY id DESC'
    );
    let users = rows.map(formatUser);

    if (skill) {
      const query = String(skill).trim().toLowerCase();
      users = users.filter((user) =>
        user.skillsOffered.some((offeredSkill) =>
          String(offeredSkill).toLowerCase().includes(query)
        )
      );
    }

    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;

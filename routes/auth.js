const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../db');

const router = express.Router();
const JWT_SECRET = 'skillhive_jwt_secret';

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

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      skillsOffered = [],
      skillsWanted = [],
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const trimmedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const offered = normalizeSkills(skillsOffered);
    const wanted = normalizeSkills(skillsWanted);

    const result = await run(
      `
        INSERT INTO users (name, email, password, skillsOffered, skillsWanted)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        trimmedName,
        normalizedEmail,
        hashedPassword,
        JSON.stringify(offered),
        JSON.stringify(wanted),
      ]
    );

    return res.status(201).json({
      id: result.id,
      name: trimmedName,
      email: normalizedEmail,
      skillsOffered: offered,
      skillsWanted: wanted,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(String(password), user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        skillsOffered: parseSkills(user.skillsOffered),
        skillsWanted: parseSkills(user.skillsWanted),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;

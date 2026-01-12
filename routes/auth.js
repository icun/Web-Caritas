const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL // define en .env
});

// secret JWT en env: JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// middleware para proteger rutas
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No authorization header' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/register
// body: { email, password, roles?: ['admin'|'tecnico'|'user'], tecnicoId?: string }
router.post('/register', async (req, res) => {
  const { email, password, roles = ['user'], tecnicoId = null } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const password_hash = bcrypt.hashSync(password, 10);
    const client = await pool.connect();
    try {
      const insert = `INSERT INTO acogida.users (email, password_hash, roles, tecnico_id)
                      VALUES ($1, $2, $3, $4) RETURNING id, email, roles, tecnico_id, created_at`;
      const result = await client.query(insert, [email, password_hash, roles, tecnicoId]);
      return res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('register error', err);
    if (err.code === '23505') return res.status(409).json({ error: 'email already exists' });
    return res.status(500).json({ error: 'server error' });
  }
});

// POST /api/login
// body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const client = await pool.connect();
    try {
      const q = 'SELECT id, email, password_hash, roles, tecnico_id FROM acogida.users WHERE email = $1';
      const r = await client.query(q, [email]);
      const user = r.rows[0];
      if (!user) return res.status(401).json({ error: 'invalid credentials' });

      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'invalid credentials' });

      const payload = {
        id: user.id,
        email: user.email,
        roles: user.roles,
        tecnicoId: user.tecnico_id
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// GET /api/me
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
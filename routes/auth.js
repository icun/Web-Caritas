const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// MySQL pool configuration
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'acogida',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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
    const connection = await pool.getConnection();
    try {
      const rolesJson = JSON.stringify(roles);
      await connection.execute(
        'INSERT INTO users (email, password_hash, roles, tecnico_id) VALUES (?, ?, ?, ?)',
        [email, password_hash, rolesJson, tecnicoId]
      );
      const [result] = await connection.execute(
        'SELECT id, email, roles, tecnico_id, created_at FROM users WHERE email = ?',
        [email]
      );
      return res.status(201).json(result[0]);
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('register error', err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'email already exists' });
    return res.status(500).json({ error: 'server error' });
  }
});

// POST /api/login
// body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const connection = await pool.getConnection();
    try {
      const [results] = await connection.execute(
        'SELECT id, email, password_hash, roles, tecnico_id FROM users WHERE email = ?',
        [email]
      );
      const user = results[0];
      if (!user) return res.status(401).json({ error: 'invalid credentials' });

      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'invalid credentials' });

      const payload = {
        id: user.id,
        email: user.email,
        roles: typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles,
        tecnicoId: user.tecnico_id
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token });
    } finally {
      connection.release();
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
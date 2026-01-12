const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // si usas .env
// (NO require('./routes/auth'))  <-- quitar, evita intento de conexión a Postgres
const app = express();

// permitir Authorization y Content-Type desde el frontend (ajusta origin si hace falta)
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '2mb' })); // importante

// monta las rutas auth bajo /api

const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const { Parser } = require('json2csv');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// reemplaza por tu acceso a BD

// app.use('/api', authRoutes);
app.use('/api', router);
// (se añade después de que el objeto `router` esté definido)
 

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';

// auth middleware: verifica Authorization: Bearer <token>
function authMiddleware(req, res, next) {
  console.log('auth header:', req.headers.authorization);
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header) return res.status(401).json({ error: 'No authorization header' });
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger global (verifica qué URL y content-type llegan)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl, 'Content-Type:', req.headers['content-type'], 'Authorization:', req.headers['authorization']);
  next();
});

const db = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'acogida'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Database connected successfully.');

    
    app.listen(3000, () => {
        console.log('Server listening on port 3000');
    });
});

app.get('/query', (req, res) => {
    const sql = req.query.sql; // <-- ahora sí usa el parámetro de la URL
    if (!sql) {
        return res.status(400).json({ error: 'No SQL query provided' });
    }
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.get('/tables/arciprestazgo', (req, res) => {
    db.query('SELECT * FROM `arciprestazgo`', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.type('text').send(
            `Tabla: arciprestazgo\n` +
            JSON.stringify(rows, null, 2)
        );
    });
});

app.get('/tables/centros', (req, res) => {
    db.query('SELECT * FROM `centros`', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.type('text').send(
            `Tabla: centros\n` +
            JSON.stringify(rows, null, 2)
        );
    });
});

app.get('/tables/tecnico', (req, res) => {
    db.query('SELECT * FROM `tecnico`', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.type('text').send(
            `Tabla: tecnicos\n` +
            JSON.stringify(rows, null, 2)
        );
    });
});

app.get('/api/tecnicos', (req, res) => {
    db.query('SELECT * FROM `tecnico`', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/tecnicoAcogida', (req, res) => {
    db.query('SELECT * FROM `tecnico_acogida`', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


app.get('/api/arciprestazgos', (req, res) => {
    db.query('SELECT * FROM `arciprestazgo`', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/centros', (req, res) => {
    db.query('SELECT idunidad, nombre FROM `centros`', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


app.get('/tables/master', (req, res) => {
    db.query('SELECT * FROM `master`', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.type('text').send(
            `Tabla: master\n` +
            JSON.stringify(rows, null, 2)
        );
    });
});

app.get('/tables', (req, res) => {
    db.query('SHOW TABLES;', (err, tables) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const tableNames = tables.map(row => Object.values(row)[0]);
        const results = {};
        let pending = tableNames.length;
        if (pending === 0) return res.type('text').send('No tables found.');

        tableNames.forEach(table => {
            db.query(`SELECT * FROM \`${table}\``, (err, rows) => {
                if (err) {
                    results[table] = { error: err.message };
                } else {
                    results[table] = rows;
                }
                pending--;
                if (pending === 0) {
                    // Formatea la respuesta con espacios y tabulaciones
                    res.type('text').send(
                        Object.entries(results).map(([table, rows]) => {
                            return `Tabla: ${table}\n` +
                                   JSON.stringify(rows, null, 2) + '\n';
                        }).join('\n')
                    );
                }
            });
        });
    });
});
app.get('/api/lista-csv', (req, res) => {
  const { fecha, tecnico } = req.query;
  let sql = 'SELECT * FROM `registro` WHERE 1=1';
  const params = [];
  if (fecha) {
    sql += ' AND fecha_atencion = ?';
    params.push(fecha);
  }
  if (tecnico) {
    sql += ' AND tecnico = ?';
    params.push(tecnico);
  }

  // Note: mysql2 callback provides (err, rows, fields)
  db.query(sql, params, (err, rows, fields) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      // No rows: send CSV with only headers (if available) or an empty file
      if (!rows || rows.length === 0) {
        const headerNames = (fields || []).map(f => f.name);
        const csv = headerNames.length ? headerNames.join(',') + '\n' : ''; // header line or empty
        res.header('Content-Type', 'text/csv');
        res.attachment('lista.csv');
        return res.send(csv);
      }

      // Rows exist: convert to CSV
      const { Parser } = require('json2csv');
      const parser = new Parser();
      const csv = parser.parse(rows);

      res.header('Content-Type', 'text/csv');
      res.attachment('lista.csv');
      res.send(csv);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
});

app.post('/api/registro', express.json(), (req, res) => {
  const datos = req.body;
  console.log('POST /api/registro datos=', datos);

  const sql = `INSERT INTO registro 
    (fecha_atencion, tipo_entrada, tipo_persona, nombre, apellido1, apellido2, sexo, tipo_documento, num_documento, pais_origen, recien_llegado, meses_espana, movil1, movil2, correo_electronico, direccion_completa, centro, arciprestazgo, tecnico, tipo_derivacion, observaciones)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [
    datos.fecha_atencion, datos.tipo_entrada, datos.tipo_persona, datos.nombre, datos.apellido1, datos.apellido2,
    datos.sexo, datos.tipo_documento, datos.num_documento, datos.pais_origen, datos.recien_llegado, datos.meses_espana,
    datos.movil1, datos.movil2, datos.correo_electronico, datos.direccion_completa,
    datos.centro, datos.arciprestazgo, datos.tecnico, datos.tipo_derivacion, datos.observaciones
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error insert registro:', err);
      return res.status(500).json({ error: err.message });
    }
    return res.json({ success: true, id: result.insertId });
  });
});

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

app.get('/api/message', (req, res) => {
  res.json({ message: '¡Hola desde el backend Express!' });
});

app.get('/api/registro', (req, res) => {
  db.query('SELECT * FROM registro', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/email-csv', express.json(), (req, res) => {
  const { fecha, tecnico } = req.body;
  if (!tecnico) return res.status(400).json({ error: 'Se requiere el identificador del técnico' });

  let sql = 'SELECT * FROM `registro` WHERE 1=1';
  const params = [];
  if (fecha) { sql += ' AND fecha_atencion = ?'; params.push(fecha); }
  if (tecnico) { sql += ' AND tecnico = ?'; params.push(tecnico); }

  db.query(sql, params, (err, rows, fields) => {
    if (err) return res.status(500).json({ error: err.message });

    // generar CSV seguro (si no hay filas, usar solo cabeceras si están disponibles)
    let csv;
    try {
      if (!rows || rows.length === 0) {
        const headers = (fields || []).map(f => f.name);
        csv = headers.length ? headers.join(',') + '\n' : '';
      } else {
        const parser = new Parser({ fields: (fields || []).map(f => f.name) });
        csv = parser.parse(rows);
      }
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }

    // obtener email del técnico desde tabla tecnico_acogida (columna Email)
    const qEmail = 'SELECT Email FROM tecnico_acogida WHERE DNI = ? OR id = ? LIMIT 1';
    db.query(qEmail, [tecnico, tecnico], (err2, recRows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (!recRows || recRows.length === 0 || !recRows[0].Email) {
        return res.status(404).json({ error: 'No se encontró email del técnico' });
      }
      const to = recRows[0].Email;

      // transporter: configurar con variables de entorno
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const tecnicoSafe = String(tecnico).replace(/\s+/g, '_');
      const fechaSafe = fecha || new Date().toISOString().slice(0,10);
      const filename = `lista_${tecnicoSafe}_${fechaSafe}.csv`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'no-reply@example.com',
        to,
        subject: `Lista ${fechaSafe} - ${tecnicoSafe}`,
        text: 'Adjunto envío de la lista en formato CSV.',
        attachments: [
          { filename, content: Buffer.from(csv), contentType: 'text/csv' }
        ]
      };

      transporter.sendMail(mailOptions, (err3, info) => {
        if (err3) return res.status(500).json({ error: err3.message });
        return res.json({ success: true, info });
      });
    });
  });
});

// POST /api/email-csv-filter
// body: { fecha?: string, tecnico?: string, email: string }
app.post('/api/email-csv-filter', async (req, res) => {
  const { fecha, tecnico, email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  try {
    // construir URL del CSV (usa tu endpoint existente)
    const params = new URLSearchParams();
    if (fecha) params.set('fecha', fecha);
    if (tecnico) params.set('tecnico', tecnico);
    const csvUrl = `http://localhost:3000/api/lista-csv${params.toString() ? '?' + params.toString() : ''}`;

    // obtener CSV (respuesta como blob)
    const resp = await fetch(csvUrl);
    if (!resp.ok) {
      const text = await resp.text().catch(()=>null);
      return res.status(500).json({ error: 'Error generando CSV', details: text });
    }
    const buffer = await resp.buffer();

    // configurar transport (usar variables de entorno)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const tecnicoNombre = tecnico || 'todos';
    const fechaSafe = fecha || new Date().toISOString().slice(0,10);
    const filename = `lista_${tecnicoNombre}_${fechaSafe}.csv`.replace(/\s+/g,'_');

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@example.com',
      to: email,
      subject: `CSV registros ${fechaSafe} - ${tecnicoNombre}`,
      text: `Adjunto CSV solicitado (${tecnicoNombre} - ${fechaSafe})`,
      attachments: [{ filename, content: buffer }]
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('email-csv-filter error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});


// register (admin crea técnico o self-register)
router.post('/register', async (req, res) => {
  const { email, password, roles = ['tecnico'], tecnicoId = null } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const rolesStr = JSON.stringify(roles);
    const [result] = await db.promise().execute(
      'INSERT INTO users (email, password_hash, roles, tecnico_id) VALUES (?, ?, ?, ?)',
      [email, hashed, rolesStr, tecnicoId]
    );
    return res.status(201).json({ id: result.insertId, email, roles, tecnicoId });
  } catch (err) {
    console.error('register error', err);
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'email already exists' });
    return res.status(500).json({ error: 'error creando usuario' });
  }
});

router.post('/login', async (req, res) => {
  console.log('POST /api/login body:', req.body);
  const { email, password } = req.body || {};
  if (!email || !password) {
    console.log('login missing fields');
    return res.status(400).json({ error: 'email y password requeridos' });
  }

  try {
    const [rows] = await db.promise().execute(
      'SELECT id, email, password_hash, roles, tecnico_id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const user = (rows || [])[0];
    console.log('found user row:', !!user, user ? { id: user.id, email: user.email, hashLength: (user.password_hash||'').length } : null);

    if (!user) {
      return res.status(401).json({ error: 'credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    console.log('bcrypt compare result:', ok);
    if (!ok) {
      return res.status(401).json({ error: 'credenciales inválidas' });
    }

    let roles = [];
    try { roles = JSON.parse(user.roles); } catch { roles = Array.isArray(user.roles) ? user.roles : ['user']; }

    const payload = { id: user.id, email: user.email, roles, tecnicoId: user.tecnico_id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    console.log('login success for', user.email);
    return res.json({ token });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

router.get('/tecnicos/:tecnicoId/usuarios', authMiddleware, async (req, res) => {
  const rid = req.params.tecnicoId;
  const user = req.user;
  if (!(user.roles?.includes('admin') || String(user.tecnicoId) === String(rid))) {
    return res.status(403).json({ error: 'forbidden' });
  }
  try {
    const [rows] = await db.promise().execute(
      'SELECT id, nombre, email FROM usuarios WHERE tecnico_id = ?',
      [rid]
    );
    return res.json(rows || []);
  } catch (err) {
    console.error('get usuarios error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// me
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// Añadir esto cerca de otros endpoints / después de declarar router y authMiddleware
router.get('/registro', authMiddleware, async (req, res) => {

   db.query('SELECT * FROM registro', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;






const express = require('express');
const path = require('path');
const cors = require('cors');

// Load .env only if it exists (for local development)
const envPath = path.join(__dirname, '.env');
const fs = require('fs');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  // In production (EB), environment variables are set directly
  console.log('No .env file found - using system environment variables');
}

const app = express();

// Determinar la ruta del cliente según el entorno
let clientDistPath;
if (process.env.NODE_ENV === 'production') {
  // En Docker/producción
  clientDistPath = path.join(__dirname, 'client_dist');
} else {
  // En desarrollo local
  clientDistPath = path.join(__dirname, '../client/dist/client/browser');
}

// Verificar que existe la carpeta del cliente
if (fs.existsSync(clientDistPath)) {
  console.log(`Client dist found at: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
} else {
  console.warn(`Warning: Client dist not found at ${clientDistPath}. API-only mode.`);
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from localhost (development) or without origin (mobile apps, same-origin requests)
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // In production, allow all origins (can be restricted to specific domains)
    // You can also check an environment variable for the allowed origin
    const allowedOrigin = process.env.CORS_ORIGIN || '*';
    if (allowedOrigin === '*' || origin === allowedOrigin) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '2mb' })); // importante

// monta las rutas auth bajo /api

const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const { Parser } = require('json2csv');
const router = express.Router();
const bcrypt = require('bcryptjs');
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

// Logger global (verifica qué URL y content-type llegan)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl, 'Content-Type:', req.headers['content-type'], 'Authorization:', req.headers['authorization']);
  next();
});

let db;
let dbConnected = false;

// In-memory user database (fallback when DB not available)
const inMemoryUsers = {
    'admin@example.com': {
        id: 1,
        email: 'admin@example.com',
        password_hash: '$2a$10$sYXgbeltCt4S7viPd9KgQ.VRuHFiRIKnXVPYY7AsOxVqtHf5jx9b.', // admin123 hashed
        roles: 'admin'
    }
};

function createDBConnection() {
    db = mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: Number(process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'acogida',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    db.connect(err => {
        if (err) {
            console.error('Database connection failed:', err.message);
            dbConnected = false;
            // Retry connection in 5 seconds
            setTimeout(createDBConnection, 5000);
        } else {
            console.log('Database connected successfully.');
            dbConnected = true;
        }
    });

    db.on('error', err => {
        console.error('Database error:', err.message);
        dbConnected = false;
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Reconnecting to database...');
            createDBConnection();
        }
    });
}

// Initial connection attempt
createDBConnection();

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Login endpoint
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Try database first, fallback to in-memory
    if (dbConnected && db) {
        db.query('SELECT id, email, password_hash, roles FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Login query error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (results.length === 0) {
                return res.status(401).json({ error: 'credenciales invalidas' });
            }
            
            const user = results[0];
            
            try {
                const passwordMatch = await bcrypt.compare(password, user.password_hash);
                
                if (!passwordMatch) {
                    return res.status(401).json({ error: 'credenciales invalidas' });
                }
                
                const token = jwt.sign(
                    { id: user.id, email: user.email, roles: user.roles },
                    JWT_SECRET,
                    { expiresIn: '8h' }
                );
                
                return res.json({
                    token,
                    user: { id: user.id, email: user.email, roles: user.roles }
                });
            } catch (bcryptErr) {
                console.error('Password comparison error:', bcryptErr);
                return res.status(500).json({ error: 'Authentication error' });
            }
        });
    } else {
        // Use in-memory fallback
        console.log('Using in-memory user database for login');
        
        if (!inMemoryUsers[email]) {
            return res.status(401).json({ error: 'credenciales invalidas' });
        }
        
        const user = inMemoryUsers[email];
        
        bcrypt.compare(password, user.password_hash, (err, match) => {
            if (err || !match) {
                return res.status(401).json({ error: 'credenciales invalidas' });
            }
            
            const token = jwt.sign(
                { id: user.id, email: user.email, roles: user.roles },
                JWT_SECRET,
                { expiresIn: '8h' }
            );
            
            return res.json({
                token,
                user: { id: user.id, email: user.email, roles: user.roles }
            });
        });
    }
});

// Register endpoint
router.post('/register', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    if (!dbConnected || !db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    // Check if user already exists
    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            
            db.query(
                'INSERT INTO users (email, password_hash, roles) VALUES (?, ?, ?)',
                [email, hashedPassword, 'user'],
                (insertErr) => {
                    if (insertErr) {
                        return res.status(500).json({ error: 'Failed to create user' });
                    }
                    
                    const token = jwt.sign(
                        { email, roles: 'user' },
                        JWT_SECRET,
                        { expiresIn: '8h' }
                    );
                    
                    return res.status(201).json({
                        token,
                        user: { email, roles: 'user' }
                    });
                }
            );
        } catch (hashErr) {
            return res.status(500).json({ error: 'Password hashing error' });
        }
    });
});

// Me endpoint (get current user info)
router.get('/me', authMiddleware, (req, res) => {
    if (!dbConnected || !db) {
        return res.status(503).json({ error: 'Database not connected' });
    }
    
    db.query('SELECT id, email, roles FROM users WHERE id = ?', [req.user.id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        return res.json(results[0]);
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

// SPA catch-all - serve index.html for non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API/query routes that weren't matched
  if (req.path.startsWith('/api') || req.path.startsWith('/query') || req.path.startsWith('/tables')) {
    return res.status(404).json({ error: 'Not found' });
  }
  // Serve index.html for all other routes (SPA)
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(404).json({ error: 'index.html not found' });
    }
  });
});

// ===== Start Server =====
const PORT_FINAL = process.env.PORT || 3000;
const https = require('https');

// Try to load certificates for HTTPS
const certPath = process.env.CERT_PATH || path.join(__dirname, 'certificate.crt');
const keyPath = process.env.KEY_PATH || path.join(__dirname, 'private.key');

let serverInstance;

try {
  // Try to use HTTPS if certificates exist and are valid
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    try {
      const cert = fs.readFileSync(certPath, 'utf8');
      const key = fs.readFileSync(keyPath, 'utf8');
      
      // Only use HTTPS if certificate content looks valid (contains BEGIN/END markers)
      if (cert.includes('BEGIN') && key.includes('BEGIN')) {
        serverInstance = https.createServer({ cert, key }, app);
        console.log(`Starting HTTPS server on port ${PORT_FINAL}...`);
      }
    } catch (httpsErr) {
      console.warn(`Could not load HTTPS certificates: ${httpsErr.message}`);
    }
  }
} catch (err) {
  console.warn(`Certificate check error: ${err.message}`);
}

// Fall back to HTTP if HTTPS setup failed
if (!serverInstance) {
  serverInstance = app;
  console.log(`Starting HTTP server on port ${PORT_FINAL}...`);
}

serverInstance.listen(PORT_FINAL, () => {
  console.log(`Server listening on port ${PORT_FINAL}`);
  console.log(`Frontend served from: ${clientDistPath}`);
});







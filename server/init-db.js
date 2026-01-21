#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'acogida'
  });

  try {
    console.log('Connecting to database...');
    
    // Crear tabla users si no existe
    console.log('Creating users table if not exists...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          roles JSON,
          tecnico_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      // Table might already exist, that's okay
      console.log('Table creation note:', e.message);
    }
    console.log('✓ users table created/verified');

    // Crear admin por defecto si no existe
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existing.length === 0) {
      console.log('Creating default admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const roles = JSON.stringify(['admin']);
      
      await connection.execute(
        'INSERT INTO users (email, password_hash, roles) VALUES (?, ?, ?)',
        [adminEmail, hashedPassword, roles]
      );
      
      console.log('✓ Admin user created');
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
      console.log('  ⚠️  IMPORTANT: Change the password in production!');
    } else {
      console.log('✓ Admin user already exists');
    }

    console.log('\n✓ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initializeDatabase();

#!/usr/bin/env node

/**
 * Actualiza la contraseña del usuario admin
 * Uso: node update-admin-password.js [email] [nueva_password]
 * Por defecto: admin@example.com / admin123
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function updateAdminPassword() {
  const email = process.argv[2] || 'admin@example.com';
  const newPassword = process.argv[3] || 'admin123';
  
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'acogida'
  });

  try {
    console.log(`Updating password for ${email}...`);
    
    // Verificar que el usuario existe
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length === 0) {
      console.log(`❌ User ${email} not found`);
      process.exit(1);
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await connection.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, email]
    );

    console.log(`✓ Password updated successfully for ${email}`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

updateAdminPassword();

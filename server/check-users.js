const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'my-app/.env' });

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'acogida'
  });

  try {
    // Verificar si la tabla existe
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [process.env.MYSQL_DATABASE]
    );
    console.log('Table exists:', tables.length > 0 ? 'YES' : 'NO');

    if (tables.length === 0) {
      console.log('Creating users table...');
      await connection.execute(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          roles JSON DEFAULT '["user"]',
          tecnico_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Table created successfully');
    }

    // Verificar si admin@example.com existe
    const [users] = await connection.execute(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      ['admin@example.com']
    );
    console.log('admin@example.com exists:', users.length > 0 ? 'YES' : 'NO');

    if (users.length === 0) {
      console.log('\nCreating admin@example.com user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await connection.execute(
        'INSERT INTO users (email, password_hash, roles) VALUES (?, ?, ?)',
        ['admin@example.com', hashedPassword, JSON.stringify(['admin', 'user'])]
      );
      console.log('User created successfully with password: admin123');
    } else {
      console.log('User already exists');
      console.log('  ID:', users[0].id);
      console.log('  Email:', users[0].email);
      console.log('  Hash length:', users[0].password_hash.length);
    }

    // Mostrar todos los usuarios
    const [allUsers] = await connection.execute(
      'SELECT id, email, roles FROM users'
    );
    console.log('\nAll users:');
    console.table(allUsers);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkUsers();

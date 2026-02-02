const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupProduction() {
  const connection = await mysql.createConnection({
    host: 'acogida.cqhacky0iobq.us-east-1.rds.amazonaws.com',
    port: 3306,
    user: 'admin',
    password: '2+;7Ov74xo,)',
    database: 'acogida'
  });

  try {
    console.log('✓ Connected to AWS RDS');

    // Verificar si la tabla existe
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      ['acogida']
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
      console.log('✓ Table created successfully');
    }

    // Verificar si admin@example.com existe
    const [users] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ?',
      ['admin@example.com']
    );

    if (users.length === 0) {
      console.log('\n→ Creating admin@example.com user...');
      const newPassword = 'admin123';
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      
      await connection.execute(
        'INSERT INTO users (email, password_hash, roles) VALUES (?, ?, ?)',
        ['admin@example.com', hashedPassword, JSON.stringify(['admin', 'user'])]
      );
      console.log('✓ Admin user created');
      console.log(`  Email: admin@example.com`);
      console.log(`  Password: ${newPassword}`);
    } else {
      console.log('\n→ Admin user already exists');
      console.log(`  Email: ${users[0].email}`);
      console.log(`  ID: ${users[0].id}`);
    }

    // Mostrar todos los usuarios
    const [allUsers] = await connection.execute(
      'SELECT id, email, roles FROM users LIMIT 10'
    );
    console.log('\nUsers in database:');
    console.table(allUsers);

  } catch (err) {
    console.error('✗ Error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('  Could not connect to AWS RDS. Check credentials and security groups.');
    }
  } finally {
    await connection.end();
  }
}

setupProduction();

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'my-app/.env' });

async function resetPassword() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'acogida'
  });

  try {
    const newPassword = 'admin123';
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    console.log('Resetting password for admin@example.com...');
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, 'admin@example.com']
    );

    if (result.affectedRows > 0) {
      console.log('✓ Password updated successfully');
      console.log(`  Email: admin@example.com`);
      console.log(`  New password: ${newPassword}`);
      console.log(`  Hash: ${hashedPassword}`);
    } else {
      console.log('✗ User not found');
    }

    // Test bcrypt compare
    console.log('\nTesting bcrypt compare:');
    const isMatch = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`  bcrypt.compare("${newPassword}", hash) = ${isMatch}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

resetPassword();

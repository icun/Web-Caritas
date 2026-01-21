#!/usr/bin/env node

/**
 * Generador de hash bcrypt
 * Uso: node generate-bcrypt-hash.js contraseña
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10).then(hash => {
  console.log('Hash bcrypt para:', password);
  console.log('Hash:', hash);
  console.log('');
  console.log('Usa este hash en la BD:');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@example.com';`);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

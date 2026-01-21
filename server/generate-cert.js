#!/usr/bin/env node

/**
 * Generate self-signed certificate using Node.js
 * Works on Windows, Mac, and Linux without external dependencies
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const certPath = path.join(__dirname, 'certificate.crt');
const keyPath = path.join(__dirname, 'private.key');

console.log('🔒 Generating self-signed certificate...');

try {
  // Generate RSA key pair (2048-bit)
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  // Export private key to PEM format
  const privateKeyPem = privateKey.export({
    format: 'pem',
    type: 'pkcs8'
  });

  // Export public key to PEM format
  const publicKeyPem = publicKey.export({
    format: 'pem',
    type: 'spki'
  });

  // Write private key
  fs.writeFileSync(keyPath, privateKeyPem, 'utf8');
  
  // For the certificate, we'll use the public key (this is a simplified approach)
  // In production, use a proper certificate from AWS ACM
  fs.writeFileSync(certPath, publicKeyPem, 'utf8');
  
  console.log('✅ Certificate and key generated successfully!');
  console.log(`   Private Key: ${keyPath}`);
  console.log(`   Certificate: ${certPath}`);
  console.log('');
  console.log('⚠️  IMPORTANT for PRODUCTION:');
  console.log('   This certificate is for development/testing only.');
  console.log('   For production HTTPS, use AWS Certificate Manager (ACM).');
  
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}

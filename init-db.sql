-- Script para inicializar la base de datos en producción
-- Usar con MySQL Workbench o mysql CLI

-- Crear tabla de usuarios si no existe
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  roles JSON,
  tecnico_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar usuario admin (la contraseña debe ser hasheada con bcrypt)
-- IMPORTANTE: Reemplaza el hash con uno válido generado con bcrypt
-- Para generar un hash válido, ejecuta:
-- node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('admin123', 10));"
-- Y reemplaza en la siguiente línea:

INSERT INTO users (email, password_hash, roles) VALUES 
  ('admin@example.com', '$2b$10$QIlf0H/Z8qDnBZKDZvBPQu7r5C6.QRvJ5QqL1J5VYz9XZB0YcYz9e', '["admin"]')
ON DUPLICATE KEY UPDATE password_hash = '$2b$10$QIlf0H/Z8qDnBZKDZvBPQu7r5C6.QRvJ5QqL1J5VYz9XZB0YcYz9e';

-- Verificar que se creó correctamente
SELECT id, email, roles FROM users;

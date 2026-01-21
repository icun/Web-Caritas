#!/bin/bash

# Script para inicializar la BD después del deployment
set -e

echo "Initializing database..."

# Si necesitas ejecutar init-db.js después del deploy, descomenta:
# cd /var/app/current
# node init-db.js

echo "Database initialization complete"

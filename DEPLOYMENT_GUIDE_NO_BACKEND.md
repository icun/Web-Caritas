# Deployment - Sin Backend en AWS

## Situación Actual
- ✅ Frontend desplegado en AWS Amplify: `https://main.dsdckejume7fb.amplifyapp.com`
- ❌ Backend NO existe en AWS - NECESITA DEPLOYMENT

## Solución

### Opción 1: AWS App Runner (RECOMENDADO - Más fácil)

**Ventajas:**
- Serverless - no te preocupes por scaling
- Despliegue automático desde ECR
- Integración con AWS

**Pasos:**

1. **Construir la imagen Docker:**
```bash
cd C:\Users\Caritas\Documents\vscodev2\my-app
docker build -t acogida-app:latest .
```

2. **Crear repositorio en AWS ECR:**
```bash
aws ecr create-repository --repository-name acogida-app --region us-east-1
```

3. **Autenticarse en ECR y subir la imagen:**
```bash
# Obtener el token de login (reemplaza 123456789 con tu AWS Account ID)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag la imagen
docker tag acogida-app:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/acogida-app:latest

# Push a ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/acogida-app:latest
```

4. **En AWS Console - Crear App Runner Service:**
   - Ir a App Runner
   - "Create service"
   - Source: Container Registry
   - ECR Repository: `123456789.dkr.ecr.us-east-1.amazonaws.com/acogida-app`
   - Port: `8080`
   - Create

5. **Configurar variables de entorno en App Runner:**
   - En el Service creado, ir a Configuration
   - Agregar variables de entorno:
     ```
     MYSQL_HOST=<tu-rds-endpoint.rds.amazonaws.com>
     MYSQL_PORT=3306
     MYSQL_USER=admin
     MYSQL_PASSWORD=<tu-password-segura>
     MYSQL_DATABASE=acogida
     JWT_SECRET=<genera-una-clave-aleatoria>
     PORT=8080
     NODE_ENV=production
     ```

6. **Inicializar la BD:**
   - Una vez App Runner esté corriendo, conectar a la BD:
   ```bash
   # Desde tu máquina local
   mysql -h <rds-endpoint> -u admin -p acogida
   
   # Ejecutar init-db desde dentro del contenedor o manualmente
   # O esperar que App Runner ejecute: npm run init-db
   ```

---

### Opción 2: EC2 (Alternativa)

**Ventajas:**
- Más control
- Menos abstracción

**Pasos:**

1. **Crear instancia EC2:**
   - AMI: Amazon Linux 2
   - Type: t3.micro (gratis con free tier)
   - Security Group: permitir puertos 22, 3000, 80, 443

2. **Conectar a la instancia:**
```bash
ssh -i "tu-key.pem" ec2-user@tu-instance-public-ip
```

3. **Instalar dependencias:**
```bash
sudo yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git
```

4. **Clonar repo y instalar:**
```bash
git clone https://github.com/tu-usuario/tu-repo.git app
cd app/server
npm install
```

5. **Crear .env:**
```bash
cat > .env << 'EOF'
MYSQL_HOST=tu-rds-endpoint.rds.amazonaws.com
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=tu-password
MYSQL_DATABASE=acogida
JWT_SECRET=tu-clave-aleatoria
PORT=3000
NODE_ENV=production
EOF
```

6. **Instalar y arrancar con PM2:**
```bash
sudo npm install -g pm2
npm run init-db
npm run update-admin-password
pm2 start server.js --name "api-server"
pm2 startup
pm2 save
```

7. **Configurar security group para puerto 3000**

---

## Verificación

Una vez desplegado, probar el login:

1. Abrir: `https://main.dsdckejume7fb.amplifyapp.com/login`
2. Entrar con:
   - Email: `admin@example.com`
   - Password: `admin123`
3. Debería funcionar si todo está correcto

## Archivos Importantes

- **Dockerfile**: En `my-app/Dockerfile` - configura la imagen Docker
- **.env.production.example**: Plantilla de variables de entorno
- **DEPLOY_INSTRUCTIONS.sh**: Script con instrucciones detalladas
- **server/update-admin-password.js**: Script para actualizar contraseña del admin
- **server/init-db.js**: Script para inicializar la BD

## Próximos Pasos

1. **¿Tienes AWS CLI configurado?**
   - Si no: `aws configure` (necesitas Access Key ID y Secret Access Key)

2. **¿Tienes RDS MySQL en AWS?**
   - Si no, crear una: AWS Console > RDS > Create Database

3. **¿Tienes Docker instalado localmente?**
   - Si no, descargarlo de docker.com

4. Ejecutar los pasos de arriba según la opción (App Runner o EC2)

## Troubleshooting

### El backend no conecta a la BD
```bash
# Verificar que la BD está accesible
mysql -h <rds-endpoint> -u admin -p -e "SELECT 1;"
```

### El contenedor no inicia
```bash
# Ver logs en App Runner o ejecutar localmente
docker run -it acogida-app:latest bash
# Verificar variables de entorno
env | grep MYSQL
```

### El login sigue fallando
```bash
# Verificar que el usuario existe en la BD
mysql -h <rds-endpoint> -u admin -p acogida -e "SELECT id, email FROM users WHERE email='admin@example.com';"

# Si no existe, ejecutar
npm run init-db
npm run update-admin-password admin@example.com admin123
```

## Contacto / Dudas

Si algo no funciona, revisa:
- Logs de App Runner (AWS Console)
- Logs de EC2 (`pm2 logs api-server`)
- Conectividad de red (Security Groups)
- Credenciales de BD

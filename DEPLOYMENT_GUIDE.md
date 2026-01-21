# Instrucciones de Deploy en AWS y Solución de Problemas de Login

## Problema Identificado

El login estaba fallando porque:

1. **URLs hardcodeadas**: El cliente Angular tenía hardcodeado `http://localhost:3000` en todos los servicios
2. **CORS restrictivo**: El servidor solo permitía requests desde `http://localhost:4200`
3. **Tabla de usuarios no inicializada**: La tabla `users` no existía o el usuario admin no estaba creado

## Solución Implementada

### 1. URLs Dinámicas (Cliente Angular)

Creamos un `ConfigService` que detecta automáticamente la URL del API:

- **En desarrollo (localhost:4200)**: Redirige a `http://localhost:3000`
- **En producción**: Usa la misma URL raíz de la aplicación

Todos los servicios ahora usan `ConfigService.getApiBaseUrl()` en lugar de URLs hardcodeadas.

### 2. CORS Flexible (Servidor Node.js)

Actualizar el servidor para aceptar requests desde cualquier origen (configurable):

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    const allowedOrigin = process.env.CORS_ORIGIN || '*';
    if (allowedOrigin === '*' || origin === allowedOrigin) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
};
```

### 3. Inicialización de Base de Datos

Script `server/init-db.js` que:
- Crea la tabla `users` si no existe
- Crea un usuario admin por defecto

**Credenciales por defecto:**
- Email: `admin@example.com`
- Password: `admin123456`

⚠️ **IMPORTANTE**: Cambiar las credenciales en producción

## Pasos de Deploy en AWS

### 1. Preparar el Servidor

```bash
cd my-app/server
npm install
node init-db.js  # Inicializar base de datos
```

### 2. Variables de Entorno (.env)

```env
MYSQL_HOST=your-aws-rds-endpoint.amazonaws.com
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=your-secure-password
MYSQL_DATABASE=acogida
JWT_SECRET=your-secret-key-here
PORT=3000
CORS_ORIGIN=*  # O tu dominio específico

# Opcionales para email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@example.com
```

### 3. Construir el Cliente Angular

```bash
cd my-app/client
npm install
ng build --configuration production
```

### 4. Deploy (Opciones)

#### Opción A: EC2 + PM2
```bash
# En el servidor
npm install -g pm2
pm2 start server.js --name "api-server"
pm2 startup
pm2 save
```

#### Opción B: Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Opción C: AWS App Runner / Elastic Beanstalk
- Subir el código a AWS CodeCommit o GitHub
- Configurar deployment automático

### 5. Servir Frontend con Backend

El servidor Node.js puede servir archivos estáticos:

```javascript
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

## Pruebas Locales

1. **Instalar dependencias:**
```bash
cd my-app && npm install
cd my-app/server && npm install
cd my-app/client && npm install
```

2. **Inicializar BD:**
```bash
cd my-app/server
node init-db.js
```

3. **Ejecutar en paralelo:**
```bash
# Terminal 1: Backend
cd my-app/server
npm start

# Terminal 2: Frontend
cd my-app/client
ng serve
```

4. **Acceder a:**
- Frontend: http://localhost:4200
- API: http://localhost:3000/api

5. **Login:**
- Email: `admin@example.com`
- Password: `admin123456`

## Problemas Comunes

### "Error de conexión a API" en AWS
- ✅ Verificar que el servidor está escuchando en el puerto correcto
- ✅ Revisar los logs de CloudWatch
- ✅ Verificar los security groups de EC2/ALB

### "credenciales inválidas" en login
- ✅ Ejecutar `node init-db.js` para crear el usuario admin
- ✅ Verificar que la tabla `users` existe
- ✅ Revisar que `JWT_SECRET` es igual en .env

### CORS error en navegador
- ✅ Revisar que `CORS_ORIGIN` está configurado correctamente
- ✅ Asegurar que el frontend y backend están en el mismo origen

## Cambios Realizados

| Archivo | Cambio |
|---------|--------|
| `server/server.js` | CORS dinámico |
| `client/src/app/config.service.ts` | Nuevo servicio de configuración |
| `client/src/app/**/*.service.ts` | Usar ConfigService |
| `server/init-db.js` | Nuevo script de inicialización |
| `server/package.json` | Scripts de npm actualizados |


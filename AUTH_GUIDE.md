# 🔐 Guía de Autenticación y Autorización

## 📖 Descripción General

Este proyecto implementa un sistema completo de autenticación y autorización basado en **OAuth2/JWT** para proteger los microservicios. Todos los servicios requieren un token JWT válido para acceder a sus endpoints.

---

## 🏗️ Arquitectura de Seguridad

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │     (NGINX)     │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
   ┌────────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
   │ Tasks Service │  │   Tasks    │  │  Analytics │
   │   Replica 1   │  │ Service    │  │  Service   │
   │   + JWT       │  │ Replica 2  │  │   + JWT    │
   └───────────────┘  │   + JWT    │  └────────────┘
                      └────────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Auth Service   │
                    │  (OAuth2/JWT)   │
                    │  - Register     │
                    │  - Login        │
                    │  - Validate     │
                    │  - Refresh      │
                    └─────────────────┘
```

---

## 🔑 Componentes del Sistema de Seguridad

### 1. **Auth Service** (Puerto 3003)
- **Registro de usuarios** con hash bcrypt
- **Login** con generación de tokens JWT
- **Refresh tokens** para renovar sesiones
- **Validación de tokens**
- **RBAC** (Role-Based Access Control)

### 2. **JWT (JSON Web Tokens)**
- **Access Token**: Expira en 15 minutos
- **Refresh Token**: Expira en 7 días
- **Payload incluye**: userId, username, email, roles

### 3. **Roles y Permisos**
- **user**: Usuario estándar con acceso básico
- **admin**: Administrador con acceso total
- **moderator**: Moderador (futuro uso)

---

## 🚀 Flujo de Autenticación

### 1️⃣ Registro de Usuario

```bash
curl -X POST http://localhost:3003/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario_demo",
    "email": "usuario@ejemplo.com",
    "password": "MiPasswordSeguro123",
    "roles": ["user"]
  }'
```

**Respuesta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "674a1b2c3d4e5f6g7h8i9j0k",
    "username": "usuario_demo",
    "email": "usuario@ejemplo.com",
    "roles": ["user"]
  }
}
```

### 2️⃣ Login (Obtener Token)

```bash
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario_demo",
    "password": "MiPasswordSeguro123"
  }'
```

**Respuesta:** Igual que el registro (accessToken, refreshToken, user info)

### 3️⃣ Usar el Token en Requests

Una vez obtenido el `accessToken`, inclúyelo en el header `Authorization`:

```bash
# Crear una tarea (Tasks Service)
curl -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi Primera Tarea",
    "description": "Esta tarea está protegida por JWT",
    "status": "pending",
    "priority": "high"
  }'
```

```bash
# Obtener estadísticas (Analytics Service)
curl -X GET http://localhost:3002/api/analytics/stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4️⃣ Renovar Token (Refresh)

Cuando el `accessToken` expira (15 min), usa el `refreshToken`:

```bash
curl -X POST http://localhost:3003/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Respuesta:** Nuevos `accessToken` y `refreshToken`

### 5️⃣ Logout

```bash
curl -X POST http://localhost:3003/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📋 Endpoints del Auth Service

| Método | Endpoint | Descripción | Auth Requerido |
|--------|----------|-------------|----------------|
| POST | `/auth/register` | Registrar nuevo usuario | ❌ No |
| POST | `/auth/login` | Iniciar sesión | ❌ No |
| POST | `/auth/refresh` | Renovar access token | ❌ No |
| POST | `/auth/logout` | Cerrar sesión | ✅ Sí |
| GET | `/auth/profile` | Obtener perfil del usuario | ✅ Sí |
| GET | `/auth/validate` | Validar token JWT | ✅ Sí |
| GET | `/health` | Health check | ❌ No |

**Swagger Documentation**: http://localhost:3003/api

---

## 🔒 Protección de Endpoints

### Todos los Servicios Están Protegidos

#### Tasks Service (Puerto 8080 - via NGINX)
Todos los endpoints de `/api/tasks/*` requieren JWT:
- `POST /api/tasks` - Crear tarea
- `GET /api/tasks` - Listar tareas
- `GET /api/tasks/:id` - Obtener tarea
- `PATCH /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea

#### Analytics Service (Puerto 3002)
Todos los endpoints de `/api/analytics/*` requieren JWT:
- `GET /api/analytics/stats` - Estadísticas generales
- `GET /api/analytics/stats/sync` - Estadísticas HTTP
- `GET /api/analytics/stats/event-driven` - Estadísticas Kafka
- `GET /api/analytics/tasks-by-priority` - Tareas por prioridad
- `GET /api/analytics/events` - Historial de eventos
- `GET /api/analytics/circuit-breaker` - Estado del circuit breaker

---

## 🛡️ RBAC (Control de Acceso Basado en Roles)

### Uso del Decorador `@Roles()`

Los endpoints pueden restringirse por roles:

```typescript
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  
  // Todos los usuarios autenticados
  @Get()
  findAll() { ... }
  
  // Solo administradores
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) { ... }
}
```

### Roles Disponibles
- **user**: Acceso estándar (por defecto en registro)
- **admin**: Acceso completo
- **moderator**: Acceso intermedio

---

## 🧪 Pruebas de Autenticación

### Script Completo de Prueba

```bash
#!/bin/bash

# 1. Registrar un usuario
echo "1. Registrando usuario..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3003/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123",
    "roles": ["user"]
  }')

# Extraer el token
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.accessToken')
echo "Token obtenido: ${TOKEN:0:50}..."

# 2. Crear una tarea con el token
echo -e "\n2. Creando tarea con JWT..."
curl -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tarea Protegida",
    "description": "Esta tarea requiere autenticación",
    "status": "pending",
    "priority": "high"
  }' | jq

# 3. Obtener estadísticas con el token
echo -e "\n3. Obteniendo estadísticas con JWT..."
curl -X GET http://localhost:3002/api/analytics/stats \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Intentar acceso sin token (debería fallar)
echo -e "\n4. Intentando acceso SIN token (debería fallar)..."
curl -X GET http://localhost:8080/api/tasks \
  -H "Content-Type: application/json"

echo -e "\n✅ Pruebas completadas!"
```

Guarda como `test-auth.sh`, dale permisos (`chmod +x test-auth.sh`) y ejecuta: `./test-auth.sh`

---

## 🔧 Configuración de Variables de Entorno

Las variables JWT se configuran en `docker-compose.yml`:

```yaml
# Auth Service
JWT_SECRET: mi_clave_secreta_jwt_super_segura_2024
JWT_EXPIRATION: 15m
JWT_REFRESH_SECRET: mi_clave_refresh_token_super_segura_2024
JWT_REFRESH_EXPIRATION: 7d

# Tasks Service y Analytics Service
JWT_SECRET: mi_clave_secreta_jwt_super_segura_2024
JWT_EXPIRATION: 15m
```

> ⚠️ **IMPORTANTE**: Cambia estos valores en producción por secretos seguros.

---

## ❌ Manejo de Errores

### Sin Token
```bash
curl -X GET http://localhost:8080/api/tasks
```
**Respuesta** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Token Expirado
```bash
curl -X GET http://localhost:8080/api/tasks \
  -H "Authorization: Bearer <token_expirado>"
```
**Respuesta** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Token Inválido
```bash
curl -X GET http://localhost:8080/api/tasks \
  -H "Authorization: Bearer invalid_token"
```
**Respuesta** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Rol Insuficiente
```bash
# Usuario 'user' intenta ejecutar acción de 'admin'
curl -X DELETE http://localhost:8080/api/tasks/123 \
  -H "Authorization: Bearer <user_token>"
```
**Respuesta** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

---

## 🔍 Verificar Token en el Navegador

### Swagger UI con Autenticación

1. Abre Swagger: http://localhost:3003/api
2. Haz clic en el botón **"Authorize"** (candado verde en la esquina superior derecha)
3. Ingresa el token en el formato: `Bearer <tu_token>`
4. Prueba los endpoints protegidos directamente desde Swagger

Lo mismo aplica para:
- **Tasks Service**: http://localhost:8080/api
- **Analytics Service**: http://localhost:3002/api

---

## 🧩 Integración con Frontend

### Ejemplo con Axios (React/Vue/Angular)

```javascript
import axios from 'axios';

// Configurar interceptor global
const api = axios.create({
  baseURL: 'http://localhost:8080'
});

// Agregar token en cada request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Manejo de tokens expirados
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('http://localhost:3003/auth/refresh', {
          refreshToken
        });
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Redirigir a login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Uso
async function getTasks() {
  const response = await api.get('/api/tasks');
  return response.data;
}
```

---

## 📊 Monitoreo y Logs

### Ver Logs del Auth Service
```bash
docker logs -f auth-service
```

Verás mensajes como:
```
[AuthService] User created: testuser
[AuthService] User logged in: testuser
[Bootstrap] Auth Service is running on: http://localhost:3003
[Bootstrap] Swagger documentation: http://localhost:3003/api
```

### Ver Logs de Validación JWT
```bash
# Tasks Service
docker logs -f tasks-service-1

# Analytics Service
docker logs -f analytics-service
```

---

## 🚀 Levantando el Sistema Completo

```bash
# 1. Levantar todos los servicios
docker compose up -d --build

# 2. Verificar que Auth Service está corriendo
docker compose ps auth-service

# 3. Esperar 30 segundos para inicialización completa
sleep 30

# 4. Probar el health check
curl http://localhost:3003/health

# 5. Registrar un usuario de prueba
curl -X POST http://localhost:3003/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@ucb.edu",
    "password": "AdminPass123",
    "roles": ["admin", "user"]
  }'
```

---

## 🔗 URLs Importantes

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Auth Service** | http://localhost:3003 | Autenticación y autorización |
| **Auth Swagger** | http://localhost:3003/api | Documentación Auth API |
| **Tasks Service (LB)** | http://localhost:8080 | Gestión de tareas (balanceado) |
| **Tasks Swagger** | http://localhost:8080/api | Documentación Tasks API |
| **Analytics Service** | http://localhost:3002 | Analíticas y estadísticas |
| **Analytics Swagger** | http://localhost:3002/api | Documentación Analytics API |
| **MongoDB Auth** | mongodb://localhost:27018 | Base de datos de usuarios |
| **MongoDB Tasks** | mongodb://localhost:27017 | Base de datos de tareas |

---

## ✅ Checklist de Seguridad

- ✅ **JWT implementado** en todos los servicios
- ✅ **Tokens con expiración** (15 min access, 7 días refresh)
- ✅ **Refresh token** para renovar sesiones
- ✅ **Passwords hasheados** con bcrypt (10 rounds)
- ✅ **RBAC** con decoradores @Roles()
- ✅ **Guards de autenticación** en todos los endpoints
- ✅ **CORS habilitado** para integraciones
- ✅ **Swagger con Bearer Auth** en todos los servicios
- ✅ **Variables de entorno** para secretos JWT
- ✅ **Health checks** en Auth Service

---

## 🎓 Conceptos Aprendidos

### OAuth2 / OpenID Connect
- Flujo de autenticación con JWT
- Access tokens y refresh tokens
- Validación de tokens entre servicios

### JWT (JSON Web Tokens)
- Estructura: Header + Payload + Signature
- Claims estándar (sub, iat, exp)
- Claims personalizados (roles, email)

### RBAC (Role-Based Access Control)
- Separación de permisos por roles
- Guards de autorización
- Decoradores para control de acceso

### Microservicios Seguros
- Autenticación centralizada
- Validación distribuida
- Secretos compartidos (JWT_SECRET)

---

## 📚 Documentación Adicional

- Ver [README.md](README.md) para información general del proyecto
- Ver [ARCHITECTURE.md](ARCHITECTURE.md) para detalles de arquitectura
- Swagger UI para API interactiva

---

## 🆘 Troubleshooting

### "Unauthorized" en todos los requests
1. Verifica que Auth Service esté corriendo: `docker compose ps auth-service`
2. Confirma que obtuviste el token: `curl http://localhost:3003/auth/login ...`
3. Verifica el formato del header: `Authorization: Bearer <token>`

### "Token expirado"
- Usa el endpoint `/auth/refresh` con el `refreshToken`
- Los access tokens expiran cada 15 minutos

### "Forbidden resource" (403)
- Tu usuario no tiene el rol requerido
- Registra un usuario con rol `admin` si necesitas permisos completos

### Auth Service no inicia
- Verifica MongoDB Auth: `docker logs mongodb-auth`
- Revisa variables de entorno en `docker-compose.yml`
- Chequea logs: `docker logs auth-service`

---

## 👨‍💻 Autor

**Universidad:** UCB - Maestría en Desarrollo de Software  
**Materia:** Arquitectura de Microservicios  
**Prácticas:** 1 y 2 - Microservicios con Resiliencia y Event-Driven Architecture

---

**🔐 ¡Sistema de autenticación implementado exitosamente!**

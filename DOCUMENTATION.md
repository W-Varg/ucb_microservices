# Documentación Técnica - Microservicios Reuniones

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Patrones Implementados](#patrones-implementados)
3. [Servicios](#servicios)
4. [Comunicación entre Servicios](#comunicación-entre-servicios)
5. [Deployment](#deployment)
6. [Testing](#testing)

## 🏗️ Arquitectura

### Diagrama de Arquitectura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           NGINX Load Balancer (Puerto 80)       │
│  - Round-robin load balancing                   │
│  - Health checks                                 │
│  - Request routing                               │
└────────┬────────────────────────┬────────────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│ Tasks Service 1  │    │ Tasks Service 2  │
│   (Réplica 1)    │    │   (Réplica 2)    │
│   Puerto 3001    │    │   Puerto 3001    │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
            ┌────────────────┐
            │  MongoDB Tasks │
            │  Puerto 27017  │
            └────────────────┘

         ┌──────────────────────┐
         │ Analytics Service    │ ◄─── HTTP Request (Retry + Circuit Breaker)
         │    (Servicio B)      │
         │    Puerto 3002       │
         └──────────────────────┘
```

### Componentes Principales

#### 1. **NGINX Load Balancer**
- **Función**: Distribuir carga entre las 2 réplicas del Tasks Service
- **Algoritmo**: Round-robin (distribución equitativa)
- **Puerto**: 80
- **Configuración**: 
  - Health checks automáticos
  - Timeout de 60 segundos
  - Headers personalizados (X-Upstream-Server)

#### 2. **Tasks Service (Servicio A)**
- **Función**: CRUD de tareas
- **Tecnología**: NestJS + MongoDB
- **Instancias**: 2 réplicas independientes
- **Puerto**: 3001 (interno)
- **Base de datos**: MongoDB compartida entre réplicas

#### 3. **Analytics Service (Servicio B)**
- **Función**: Estadísticas y análisis de tareas
- **Tecnología**: NestJS
- **Instancias**: 1
- **Puerto**: 3002
- **Comunicación**: HTTP con Tasks Service (vía Load Balancer)

## 🔧 Patrones Implementados

### 1. Retry Pattern

**Ubicación**: `analytics-service/src/common/http-client.service.ts`

**Características**:
- ✅ Reintentos automáticos (configurable, default: 3)
- ✅ Backoff exponencial (1s, 2s, 4s, 8s...)
- ✅ Timeout de 5 segundos por petición
- ✅ Logging detallado de cada reintento

**Implementación**:
```typescript
retry({
  count: retries,
  delay: (error, retryCount) => {
    const backoffDelay = retryDelay * Math.pow(2, retryCount - 1);
    return of(error).pipe(delay(backoffDelay));
  },
})
```

**Ejemplo de uso**:
```typescript
await this.httpClient.get<Task[]>(
  `${this.tasksServiceUrl}/api/tasks`,
  3,    // 3 reintentos
  1000  // 1 segundo inicial
);
```

### 2. Circuit Breaker Pattern

**Ubicación**: `analytics-service/src/common/http-client.service.ts`

**Estados del Circuit Breaker**:
1. **CLOSED** (Cerrado - Normal)
   - Las peticiones pasan normalmente
   - Se monitorean los fallos

2. **OPEN** (Abierto - Bloqueando)
   - Las peticiones son bloqueadas inmediatamente
   - Se activa tras N fallos consecutivos (default: 3)
   - Se mantiene abierto por 30 segundos

3. **HALF_OPEN** (Semi-abierto - Probando)
   - Permite pasar algunas peticiones de prueba
   - Si tienen éxito → vuelve a CLOSED
   - Si fallan → vuelve a OPEN

**Configuración**:
```typescript
failureThreshold = 3;      // Fallos para abrir circuito
resetTimeout = 30000;       // 30 segundos hasta HALF_OPEN
successThreshold = 2;       // Éxitos para cerrar circuito
```

**Endpoints de control**:
- `GET /api/analytics/circuit-breaker` - Ver estado
- `POST /api/analytics/circuit-breaker/reset` - Reiniciar manualmente

### 3. Load Balancing Pattern

**Implementación**: NGINX Round-robin

**Características**:
- ✅ Distribución equitativa de carga
- ✅ Health checks automáticos
- ✅ Failover automático si una instancia falla
- ✅ Keepalive connections (32 conexiones)

**Configuración NGINX**:
```nginx
upstream tasks_backend {
    server tasks-service-1:3001;
    server tasks-service-2:3001;
    keepalive 32;
}
```

## 📡 Servicios

### Tasks Service (Servicio A)

**Endpoints**:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tasks` | Listar todas las tareas |
| POST | `/api/tasks` | Crear nueva tarea |
| GET | `/api/tasks/:id` | Obtener tarea por ID |
| PATCH | `/api/tasks/:id` | Actualizar tarea |
| DELETE | `/api/tasks/:id` | Eliminar tarea |
| GET | `/health` | Health check |

**Modelo de Tarea**:
```typescript
{
  title: string;           // Requerido
  description?: string;    // Opcional
  completed: boolean;      // Default: false
  priority: 'low' | 'medium' | 'high';  // Default: 'medium'
  createdAt: Date;
  updatedAt: Date;
}
```

**Ejemplo de petición**:
```bash
curl -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implementar microservicios",
    "description": "Completar práctica 1",
    "priority": "high"
  }'
```

### Analytics Service (Servicio B)

**Endpoints**:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/analytics/stats` | Estadísticas generales |
| GET | `/api/analytics/tasks-by-priority` | Tareas por prioridad |
| GET | `/api/analytics/circuit-breaker` | Estado del circuit breaker |
| POST | `/api/analytics/circuit-breaker/reset` | Reiniciar circuit breaker |
| GET | `/health` | Health check |

**Ejemplo de respuesta de estadísticas**:
```json
{
  "total": 10,
  "completed": 5,
  "pending": 5,
  "byPriority": {
    "high": 3,
    "medium": 4,
    "low": 3
  },
  "completionRate": "50.00%",
  "circuitBreakerState": "CLOSED",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔗 Comunicación entre Servicios

### Analytics → Tasks Service

**Tipo**: Comunicación HTTP Síncrona

**Flujo**:
1. Analytics Service recibe petición
2. Realiza llamada HTTP a Tasks Service (vía Load Balancer)
3. Aplica Retry Pattern si falla
4. Circuit Breaker monitorea y bloquea si hay demasiados fallos
5. Procesa respuesta y devuelve estadísticas

**URL de comunicación**:
```
Analytics Service → http://nginx-lb/api/tasks → Load Balancer → Tasks Service
```

**Resiliencia**:
- ✅ 3 reintentos con backoff exponencial
- ✅ Circuit breaker para proteger contra fallos en cascada
- ✅ Timeout de 5 segundos por petición
- ✅ Manejo de errores con respuestas informativas

## 🚀 Deployment

### Requisitos
- Docker 20+
- Docker Compose 2+
- 2GB RAM mínimo
- Puertos disponibles: 80, 3001, 3002, 27017

### Inicio Rápido

```bash
# 1. Dar permisos de ejecución a scripts
chmod +x start.sh test.sh stop.sh

# 2. Iniciar servicios
./start.sh

# 3. Ejecutar pruebas
./test.sh

# 4. Detener servicios
./stop.sh
```

### Comandos Docker Compose

```bash
# Construir e iniciar
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Ver estado
docker-compose ps

# Detener
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### Variables de Entorno

**Tasks Service**:
```env
PORT=3001
MONGODB_URI=mongodb://mongodb-tasks:27017/tasks-db
INSTANCE_NAME=tasks-service-1
```

**Analytics Service**:
```env
PORT=3002
TASKS_SERVICE_URL=http://nginx-lb
```

## 🧪 Testing

### Pruebas Manuales

**1. Health Checks**:
```bash
# Load Balancer
curl http://localhost/health

# Analytics Service
curl http://localhost:3002/health
```

**2. Crear Tarea**:
```bash
curl -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","priority":"high"}'
```

**3. Obtener Estadísticas**:
```bash
curl http://localhost:3002/api/analytics/stats
```

**4. Verificar Load Balancing**:
```bash
# Ejecutar múltiples veces y verificar que alterna entre instancias
for i in {1..5}; do
  curl -s http://localhost/health | grep instance
done
```

**5. Probar Circuit Breaker**:
```bash
# 1. Detener ambas instancias de Tasks Service
docker stop tasks-service-1 tasks-service-2

# 2. Intentar obtener estadísticas (debería fallar tras reintentos)
curl http://localhost:3002/api/analytics/stats

# 3. Ver estado del circuit breaker
curl http://localhost:3002/api/analytics/circuit-breaker

# 4. Reiniciar servicios
docker start tasks-service-1 tasks-service-2

# 5. Esperar 30 segundos o reiniciar circuit breaker
curl -X POST http://localhost:3002/api/analytics/circuit-breaker/reset
```

### Swagger UI

Accede a la documentación interactiva:

- **Tasks Service**: http://localhost:3001/api
- **Analytics Service**: http://localhost:3002/api

### Script de Pruebas Automatizadas

```bash
./test.sh
```

Este script ejecuta:
- ✅ Health checks de todos los servicios
- ✅ Creación de múltiples tareas
- ✅ Obtención de estadísticas
- ✅ Verificación de load balancing
- ✅ Estado del circuit breaker

## 📊 Monitoreo

### Logs

```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f tasks-service-1
docker-compose logs -f analytics-service
docker-compose logs -f nginx-lb
```

### Métricas NGINX

```bash
# Status de NGINX (desde dentro del contenedor)
docker exec nginx-lb curl http://localhost/nginx-status
```

### Health Checks

Todos los servicios incluyen health checks configurados en Docker Compose:
- Intervalo: 10 segundos
- Timeout: 5 segundos
- Reintentos: 3-5

## 🔒 Seguridad

### Consideraciones Implementadas

1. **Validación de Datos**: 
   - Class-validator en DTOs
   - Whitelist de propiedades
   - Transform automático

2. **CORS**: 
   - Habilitado en todos los servicios
   - Configurable por entorno

3. **Timeouts**: 
   - Request timeout: 5 segundos
   - Connection timeout: 60 segundos

4. **Health Checks**: 
   - Automáticos en todos los servicios
   - Reinicio automático si fallan

## 📝 Notas Adicionales

### Ventajas de la Arquitectura

✅ **Escalabilidad**: Fácil agregar más réplicas de Tasks Service  
✅ **Resiliencia**: Circuit breaker y retry protegen contra fallos  
✅ **Mantenibilidad**: Servicios independientes con responsabilidades claras  
✅ **Observabilidad**: Logs detallados y health checks  
✅ **Documentación**: Swagger UI automático  

### Posibles Mejoras Futuras

- 🔄 Implementar event-driven communication con RabbitMQ/Kafka
- 📊 Agregar métricas con Prometheus
- 🔍 Implementar distributed tracing con Jaeger
- 🔐 Agregar autenticación con JWT
- 💾 Implementar cache con Redis
- 🎯 API Gateway centralizado
- 🐳 Kubernetes deployment

## 📞 Soporte

Para problemas o preguntas:
1. Revisar logs: `docker-compose logs`
2. Verificar health checks: `docker-compose ps`
3. Consultar documentación Swagger

---

**Autor**: UCB - Maestría en Desarrollo de Software  
**Versión**: 1.0.0  
**Fecha**: 2024

# 🚀 Proyecto Microservicios - Reuniones

## 📌 Práctica 1: Microservicios con Patrones de Resiliencia

**Universidad:** UCB - Maestría en Desarrollo de Software  
**Materia:** Arquitectura de Microservicios  
**Versión:** 1.0.0

---

## 📖 Índice Rápido

- 📚 **Documentación Completa**: Ver [`INDEX.md`](INDEX.md) para navegación de todos los documentos
- ⚡ **Inicio Rápido**: Ver [`QUICKSTART.md`](QUICKSTART.md) para empezar inmediatamente
- 📦 **Entrega**: Ver [`ENTREGA.md`](ENTREGA.md) para requisitos y validación
- 🏗️ **Arquitectura**: Ver [`ARCHITECTURE.md`](ARCHITECTURE.md) para diagramas detallados
- 🔧 **Patrones**: Ver [`PATTERNS.md`](PATTERNS.md) para implementación de patrones
- 📊 **Resumen**: Ver [`RESUMEN.md`](RESUMEN.md) para resumen ejecutivo

---

## 🎯 Descripción del Proyecto

Este proyecto implementa una **arquitectura de microservicios completa** con NestJS que cumple con todos los requisitos de la práctica, incluyendo patrones de resiliencia, load balancing, y orquestación con Docker Compose.

### Servicios Implementados

- **Tasks Service (Servicio A)**: Gestión completa de tareas (CRUD) con 2 réplicas balanceadas
- **Analytics Service (Servicio B)**: Servicio de analíticas y estadísticas con patrones de resiliencia

### Características Implementadas

✅ **Patrones de Resiliencia**
- Circuit Breaker para llamadas HTTP
- Retry Pattern con backoff exponencial

✅ **Load Balancing**
- NGINX como Load Balancer para Tasks Service
- 2 réplicas del Tasks Service (tasks-service-1 y tasks-service-2)

✅ **Documentación API**
- Swagger UI en cada microservicio
- Tasks Service: http://localhost:3001/api
- Analytics Service: http://localhost:3002/api

### Estructura del Proyecto

```
reuniones/
├── tasks-service/          # Servicio A - Gestión de Tareas
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── analytics-service/      # Servicio B - Analíticas
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── nginx-lb/              # Load Balancer
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml     # Orquestación completa
```

### Requisitos Previos

- Docker
- Docker Compose
- Node.js 18+ (para desarrollo local)

### Inicio Rápido

```bash
# Construir y ejecutar todos los servicios
docker-compose up --build

# Ejecutar en background
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Endpoints Disponibles

#### Tasks Service (a través del Load Balancer)
- GET http://localhost/api/tasks - Obtener todas las tareas
- POST http://localhost/api/tasks - Crear tarea
- GET http://localhost/api/tasks/:id - Obtener tarea por ID
- PATCH http://localhost/api/tasks/:id - Actualizar tarea
- DELETE http://localhost/api/tasks/:id - Eliminar tarea
- GET http://localhost/health - Health check

#### Analytics Service (acceso directo)
- GET http://localhost:3002/api/analytics/stats - Estadísticas generales
- GET http://localhost:3002/api/analytics/tasks-by-priority - Tareas por prioridad
- GET http://localhost:3002/health - Health check

### Documentación Swagger

- Tasks Service: http://localhost:3001/api
- Analytics Service: http://localhost:3002/api

### Base de Datos

- MongoDB para Tasks Service (puerto 27017)
- MongoDB para Analytics Service (puerto 27018)

### Pruebas

```bash
# Crear una tarea
curl -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi primera tarea","description":"Descripción de prueba","priority":"high"}'

# Obtener estadísticas
curl http://localhost:3002/api/analytics/stats
```

### Arquitectura

```
Frontend → API Gateway → Load Balancer (NGINX) → [Tasks Service 1, Tasks Service 2]
                              ↓
                       Analytics Service
                              ↓
                         MongoDB
```

### Patrones Implementados

1. **Retry Pattern**: Reintentos automáticos en llamadas HTTP con backoff exponencial
2. **Circuit Breaker**: Protección contra fallos en cascada
3. **Load Balancing**: Distribución de carga entre réplicas del Tasks Service

### Variables de Entorno

Configurables en `docker-compose.yml`:

- `MONGODB_URI`: URI de conexión a MongoDB
- `PORT`: Puerto del servicio
- `TASKS_SERVICE_URL`: URL del Tasks Service (para Analytics)

### Desarrollo Local

```bash
# Tasks Service
cd tasks-service
npm install
npm run start:dev

# Analytics Service
cd analytics-service
npm install
npm run start:dev
```

### Autor

UCB - Maestría en Desarrollo de Software

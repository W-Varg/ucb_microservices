# 📦 Instrucciones de Entrega - Práctica 1 Microservicios

## ✅ Checklist de Requisitos Cumplidos

### 1. Partición en Microservicios ✅
- **Servicio A (Tasks Service)**: Gestión de tareas (CRUD completo)
- **Servicio B (Analytics Service)**: Analíticas y estadísticas
- Separación basada en el dominio (Domain-Driven Design)
- Cada servicio con su propia carpeta
- Cada servicio con su propio Dockerfile

### 2. Patrones de Resiliencia ✅
- **Retry Pattern**: 3 reintentos con backoff exponencial
- **Circuit Breaker**: Protección contra fallos en cascada
- Implementados en comunicación HTTP síncrona entre servicios
- Archivo: `analytics-service/src/common/http-client.service.ts`

### 3. Load Balancer y Réplicas ✅
- **2 réplicas** del Tasks Service (tasks-service-1 y tasks-service-2)
- **NGINX** como Load Balancer
- Algoritmo: Round-robin
- Dockerfile personalizado para NGINX con configuración

### 4. Docker Compose ✅
- Todas las instancias declaradas
- 2 réplicas de Tasks Service
- 1 instancia de Analytics Service
- NGINX Load Balancer
- MongoDB para Tasks Service
- Health checks configurados
- Red bridge para comunicación

### 5. Listo para Ejecutar ✅
- Sin configuraciones adicionales necesarias
- Comando único: `docker compose up --build`
- Docker Compose V2 integrado en Docker 20.10+

## 📋 Contenido del Entregable

```
ucb_microservices/
├── README.md                    # Descripción general del proyecto
├── QUICKSTART.md                # Guía de inicio rápido
├── QUICK_TEST.md                # Guía de verificación y pruebas
├── DOCUMENTATION.md             # Documentación técnica completa
├── PATTERNS.md                  # Explicación de patrones implementados
├── ENTREGA.md                   # Este archivo
├── docker compose.yml           # Orquestación completa
├── .gitignore                   # Archivos ignorados
│
├── tasks-service/               # Servicio A - Tasks
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── tasks/
│   │   │   ├── tasks.controller.ts
│   │   │   ├── tasks.service.ts
│   │   │   ├── tasks.module.ts
│   │   │   ├── dto/
│   │   │   │   └── task.dto.ts
│   │   │   └── schemas/
│   │   │       └── task.schema.ts
│   │   └── health/
│   │       ├── health.controller.ts
│   │       ├── health.service.ts
│   │       └── health.module.ts
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── analytics-service/           # Servicio B - Analytics
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── analytics/
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── analytics.module.ts
│   │   ├── common/
│   │   │   └── http-client.service.ts  # Retry + Circuit Breaker
│   │   └── health/
│   │       ├── health.controller.ts
│   │       ├── health.service.ts
│   │       └── health.module.ts
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
└── nginx-lb/                    # Load Balancer
    ├── nginx.conf               # Configuración de balanceo
    └── Dockerfile               # Imagen personalizada
```

## 🚀 Instrucciones de Ejecución

### Requisitos Previos
- Docker 20+
- Docker Compose 2+
- Puertos disponibles: 80, 3001, 3002, 27017

### Paso 1: Descomprimir el ZIP
```bash
unzip reuniones.zip
cd reuniones
```

### Paso 2: Dar permisos a scripts (Linux/Mac)
```bash
chmod +x start.sh test.sh stop.sh
```

### Paso 3: Iniciar servicios
```bash
# Opción 1: Usando script
./start.sh

# Comando único para levantar todo
docker compose up --build -d
```

### Paso 4: Verificar que todo funciona
```bash
# Verificar estado de servicios
curl http://localhost/health
curl http://localhost:3002/health
curl http://localhost/api/tasks
curl http://localhost:3002/api/analytics/stats
```

### Paso 5: Acceder a Swagger UI
- Tasks Service: http://localhost:3001/api
- Analytics Service: http://localhost:3002/api

## 🧪 Validación de Requisitos

### 1. Verificar 2 Réplicas del Tasks Service
```bash
docker compose ps | grep tasks-service
```
**Resultado esperado**: 2 contenedores (tasks-service-1 y tasks-service-2)

### 2. Verificar Load Balancer
```bash
for i in {1..10}; do curl -s http://localhost/health | grep instance; done
```
**Resultado esperado**: Alternancia entre "tasks-service-1" y "tasks-service-2"

### 3. Verificar Retry Pattern
```bash
# Ver logs durante una petición
docker compose logs -f analytics-service &
curl http://localhost:3002/api/analytics/stats
```
**Resultado esperado**: Si hay fallos temporales, se ven reintentos en los logs

### 4. Verificar Circuit Breaker
```bash
# Detener Tasks Service
docker compose stop tasks-service-1 tasks-service-2

# Hacer múltiples peticiones
for i in {1..5}; do curl http://localhost:3002/api/analytics/stats; sleep 1; done

# Ver estado del circuit breaker
curl http://localhost:3002/api/analytics/circuit-breaker
```
**Resultado esperado**: Estado "OPEN" después de 3 fallos

### 5. Verificar Comunicación HTTP
```bash
# Analytics debe poder obtener datos de Tasks
curl http://localhost:3002/api/analytics/stats
```
**Resultado esperado**: Estadísticas calculadas desde Tasks Service

## 📊 Evidencias de Funcionamiento

### Health Checks
```bash
# Load Balancer
curl http://localhost/health
# Respuesta: {"status":"OK","service":"Tasks Service (Servicio A)",...}

# Analytics Service
curl http://localhost:3002/health
# Respuesta: {"status":"OK","service":"Analytics Service (Servicio B)",...}
```

### CRUD de Tareas
```bash
# Crear
curl -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","priority":"high"}'

# Listar
curl http://localhost/api/tasks

# Obtener por ID (usar ID de la respuesta anterior)
curl http://localhost/api/tasks/[ID]

# Actualizar
curl -X PATCH http://localhost/api/tasks/[ID] \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Eliminar
curl -X DELETE http://localhost/api/tasks/[ID]
```

### Estadísticas desde Analytics
```bash
# Estadísticas generales
curl http://localhost:3002/api/analytics/stats

# Tareas por prioridad
curl http://localhost:3002/api/analytics/tasks-by-priority

# Estado del circuit breaker
curl http://localhost:3002/api/analytics/circuit-breaker
```

## 🔍 Logs y Debugging

### Ver logs de todos los servicios
```bash
docker compose logs -f
```

### Ver logs de un servicio específico
```bash
docker compose logs -f tasks-service-1
docker compose logs -f analytics-service
docker compose logs -f nginx-lb
```

### Ver estado de contenedores
```bash
docker compose ps
```

## 🛑 Detener el Proyecto

```bash
# Detener contenedores
docker compose down

# Con eliminación de volúmenes
docker compose down -v
```

## 📐 Arquitectura Implementada

```
┌─────────────────────────────────────────────────────┐
│                     Cliente                         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         NGINX Load Balancer (Puerto 80)             │
│         - Round-robin algorithm                     │
│         - Health checks                             │
└───────┬──────────────────────────┬──────────────────┘
        │                          │
        ▼                          ▼
┌───────────────────┐    ┌───────────────────┐
│ Tasks Service 1   │    │ Tasks Service 2   │
│  (Réplica 1)      │    │  (Réplica 2)      │
│  Puerto: 3001     │    │  Puerto: 3001     │
└─────────┬─────────┘    └─────────┬─────────┘
          │                        │
          └──────────┬─────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  MongoDB Tasks │
            │  Puerto: 27017 │
            └────────────────┘

        ┌──────────────────────┐
        │ Analytics Service    │ ◄─ HTTP + Retry + Circuit Breaker
        │   (Servicio B)       │
        │   Puerto: 3002       │
        └──────────────────────┘
```

## 🎯 Patrones Implementados

### Retry Pattern
- **Archivo**: `analytics-service/src/common/http-client.service.ts`
- **Líneas**: 40-90
- **Configuración**: 3 reintentos, backoff exponencial (1s, 2s, 4s)

### Circuit Breaker Pattern
- **Archivo**: `analytics-service/src/common/http-client.service.ts`
- **Líneas**: 10-150
- **Estados**: CLOSED, OPEN, HALF_OPEN
- **Configuración**: 3 fallos → OPEN, 30s timeout, 2 éxitos → CLOSED

### Load Balancing Pattern
- **Archivo**: `nginx-lb/nginx.conf`
- **Algoritmo**: Round-robin
- **Instancias**: 2 réplicas de Tasks Service

## 📚 Documentación Adicional

- **README.md**: Descripción general y guía de inicio
- **QUICKSTART.md**: Comandos rápidos y pruebas
- **DOCUMENTATION.md**: Documentación técnica completa
- **PATTERNS.md**: Explicación detallada de patrones
- **Swagger UI**: Documentación interactiva de APIs

## 🎓 Tecnologías Utilizadas

- **Framework Backend**: NestJS (TypeScript)
- **Base de Datos**: MongoDB
- **Load Balancer**: NGINX
- **Orquestación**: Docker Compose
- **Patrones**: Retry, Circuit Breaker, Load Balancing
- **Documentación**: Swagger/OpenAPI
- **HTTP Client**: Axios + RxJS

## ✨ Características Adicionales

- ✅ Swagger UI para ambos servicios
- ✅ Health checks en todos los servicios
- ✅ Logging detallado
- ✅ Validación de datos con class-validator
- ✅ TypeScript con tipado fuerte
- ✅ Arquitectura modular
- ✅ Separación de responsabilidades
- ✅ Docker multi-stage builds
- ✅ Scripts de automatización

## 📞 Soporte

Para problemas:
1. Revisar logs: `docker compose logs`
2. Verificar puertos: `sudo lsof -i :80` y `sudo lsof -i :3002`
3. Limpiar y reiniciar: `docker compose down -v && docker compose up --build`

---

## 📦 Crear ZIP para Entrega

```bash
# Desde el directorio del proyecto
zip -r ucb_microservices.zip . -x "*/node_modules/*" "*/dist/*" "*/.git/*"
```

---

**Estudiante**: [Tu Nombre]  
**Materia**: Arquitectura de Microservicios
**Institución**: UCB - Maestría en Desarrollo de Software  
**Fecha**: Noviembre 2024  
**Práctica**: Número 1 - Microservicios con Patrones de Resiliencia

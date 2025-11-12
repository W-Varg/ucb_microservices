# 🚀 Proyecto Microservicios - Sistema de Gestión de Tareas

## 📌 Prácticas Implementadas

### Práctica 1: Microservicios con Patrones de Resiliencia
### Práctica 2: Event-Driven Architecture con Kafka

**Universidad:** UCB - Maestría en Desarrollo de Software  
**Materia:** Arquitectura de Microservicios  

---

## 🎯 Servicios Implementados

- **Tasks Service (Servicio A)**: Gestión completa de tareas (CRUD) con 2 réplicas balanceadas
  - Persistencia en MongoDB
  - Publicador de eventos Kafka (Producer)
  
- **Analytics Service (Servicio B)**: Servicio de analíticas y estadísticas
  - Consumidor de eventos Kafka (Consumer)
  - Cliente HTTP con patrones de resiliencia

- **NGINX Load Balancer**: Distribución de carga para Tasks Service

- **Kafka Cluster**: Broker de mensajería para comunicación asíncrona
  - Zookeeper para coordinación
  - 4 topics específicos para eventos de tareas

---

## ✨ Características Implementadas

### 🛡️ Patrones de Resiliencia (Práctica 1)
- ✅ Circuit Breaker para llamadas HTTP síncronas
- ✅ Retry Pattern con backoff exponencial
- ✅ Timeout y manejo de errores

### ⚖️ Load Balancing
- ✅ NGINX como Load Balancer
- ✅ 2 réplicas del Tasks Service (Round-robin)
- ✅ Health checks automáticos

### 🔄 Event-Driven Architecture (Práctica 2)
- ✅ Kafka Cluster configurado
- ✅ Topics creados automáticamente con `kafka-init`
- ✅ Tasks Service publica eventos (Producer)
- ✅ Analytics Service consume eventos (Consumer)
- ✅ Comunicación dual: HTTP (síncrono) + Kafka (asíncrono)

### 📚 Documentación
- ✅ Swagger UI en cada microservicio
- ✅ Tasks Service: http://localhost:8080/api
- ✅ Analytics Service: http://localhost:3002/api

---

### Requisitos Previos

Asegúrate de tener instalado:
- **Docker** (versión 20.10 o superior) - incluye Docker Compose V2

Para verificar las versiones:
```bash
docker --version
docker compose version
```

---

## 🚀 Inicio Rápido

### Pasos para Ejecutar

#### 1. Clonar el repositorio
```bash
git clone https://github.com/W-Varg/ucb_microservices.git
cd ucb_microservices
```

#### 2. Levantar todos los servicios
```bash
docker compose up -d --build
```

Este comando:
- Construye las imágenes Docker de todos los servicios
- Inicia Zookeeper, Kafka, MongoDB
- Crea los topics de Kafka automáticamente
- Inicia Tasks Service (2 réplicas), NGINX Load Balancer y Analytics Service
- Crea la red y volúmenes necesarios
- Ejecuta todo en segundo plano

⏱️ **Tiempo estimado:** 2-3 minutos para el primer inicio

#### 3. Verificar que los servicios están corriendo
```bash
docker compose ps
```

Deberías ver todos los servicios con estado `Up` y `healthy`:
- ✅ zookeeper
- ✅ kafka
- ✅ kafka-init (exits after creating topics)
- ✅ mongodb-tasks
- ✅ tasks-service-1
- ✅ tasks-service-2
- ✅ nginx-lb
- ✅ analytics-service

#### 4. Verificar topics de Kafka creados
```bash
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list
```

Deberías ver:
- task-created
- task-deleted
- task-events
- task-updated

#### 5. Ver los logs (opcional)
```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f tasks-service-1
docker compose logs -f analytics-service
docker compose logs -f kafka
```

#### 6. Detener todos los servicios
```bash
# Detener y remover contenedores
docker compose down

# Detener y eliminar también los volúmenes (datos de MongoDB y Kafka)
docker compose down -v
```

---

## 🏗️ Estructura del Proyecto

```
ucb_microservices/
├── tasks-service/          # Servicio A - Gestión de Tareas
│   ├── src/
│   │   ├── tasks/         # CRUD de tareas
│   │   ├── kafka/         # Producer de eventos
│   │   └── health/        # Health checks
│   ├── Dockerfile
│   └── package.json
│
├── analytics-service/      # Servicio B - Analíticas
│   ├── src/
│   │   ├── analytics/     # Lógica de analytics
│   │   ├── kafka/         # Consumer de eventos
│   │   ├── common/        # HTTP client con resiliencia
│   │   └── health/        # Health checks
│   ├── Dockerfile
│   └── package.json
│
├── nginx-lb/              # Load Balancer
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml     # Orquestación completa
├── README.md             # Este archivo
├── KAFKA_README.md       # Guía detallada de Kafka
└── ARCHITECTURE.md       # Diagrama de arquitectura
```

---

## 🌐 Endpoints Disponibles

### Tasks Service (a través del Load Balancer - Puerto 8080)
**Base URL:** `http://localhost:8080`

- `GET /api/tasks` - Obtener todas las tareas
- `POST /api/tasks` - Crear una nueva tarea (⚡ publica evento en Kafka)
- `GET /api/tasks/:id` - Obtener tarea por ID
- `PATCH /api/tasks/:id` - Actualizar tarea (⚡ publica evento en Kafka)
- `DELETE /api/tasks/:id` - Eliminar tarea (⚡ publica evento en Kafka)
- `GET /health` - Health check

**Swagger UI:** http://localhost:8080/api

### Analytics Service (Puerto 3002)
**Base URL:** `http://localhost:3002`

#### Endpoints de Estadísticas
- `GET /api/analytics/stats` - **Estadísticas combinadas** (HTTP + Kafka)
- `GET /api/analytics/stats/sync` - Estadísticas via HTTP (síncrono con resiliencia)
- `GET /api/analytics/stats/event-driven` - Estadísticas via Kafka (asíncrono, caché)
- `GET /api/analytics/tasks-by-priority` - Tareas agrupadas por prioridad (HTTP)

#### Endpoints de Kafka
- `GET /api/analytics/events?limit=20` - Historial de eventos de Kafka procesados
- `GET /api/analytics/circuit-breaker` - Estado del Circuit Breaker
- `POST /api/analytics/circuit-breaker/reset` - Reiniciar Circuit Breaker

**Swagger UI:** http://localhost:3002/api

### Kafka (Puerto 9092)
- Broker interno: `kafka:9092`
- Broker externo: `localhost:9093`

**Topics disponibles:**
- `task-created` - Eventos de tareas creadas
- `task-updated` - Eventos de tareas actualizadas
- `task-deleted` - Eventos de tareas eliminadas
- `task-events` - Eventos generales

---

## 🧪 Pruebas Rápidas

### 🎯 Escenario 1: Crear tarea y ver evento en Kafka

```bash
# 1. Crear una tarea (genera evento Kafka)
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Kafka Event",
    "description": "Esta tarea genera un evento",
    "priority": "high"
  }'

# 2. Ver estadísticas event-driven (actualizadas por Kafka)
curl http://localhost:3002/api/analytics/stats/event-driven | jq

# 3. Ver historial de eventos procesados
curl http://localhost:3002/api/analytics/events | jq
```

### 🔄 Escenario 2: Comparar HTTP vs Kafka

```bash
# Estadísticas via HTTP (síncrono, con resiliencia)
curl http://localhost:3002/api/analytics/stats/sync | jq

# Estadísticas via Kafka (asíncrono, caché)
curl http://localhost:3002/api/analytics/stats/event-driven | jq

# Comparación lado a lado
curl http://localhost:3002/api/analytics/stats | jq
```

### 📊 Escenario 3: Monitorear eventos en tiempo real

```bash
# Terminal 1: Ver logs del consumer
docker compose logs -f analytics-service | grep "Received event"

# Terminal 2: Crear varias tareas
for i in {1..5}; do
  curl -X POST http://localhost:8080/api/tasks \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Task $i\",\"priority\":\"high\"}"
  sleep 1
done
```

---

## 🧪 Pruebas con cURL (Completas)

### 📋 Tasks Service

#### 1. Health Check
```bash
curl http://localhost:8080/health
```

#### 2. Crear una tarea
```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi primera tarea",
    "description": "Descripción de prueba",
    "priority": "high"
  }'
```

#### 3. Crear tarea con prioridad media
```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tarea con prioridad media",
    "description": "Esta es una tarea de prioridad media",
    "priority": "medium"
  }'
```

#### 4. Crear tarea con prioridad baja
```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tarea con prioridad baja",
    "description": "Esta es una tarea de prioridad baja",
    "priority": "low"
  }'
```

#### 5. Listar todas las tareas
```bash
curl http://localhost:8080/api/tasks | jq
```

#### 6. Listar todas las tareas (formato JSON legible)
```bash
curl -s http://localhost:8080/api/tasks | jq
```

#### 7. Obtener una tarea específica por ID
**NOTA**: primero debe crear una tarea para poder obtener un ID, y asi para podeer trabajar con el siguiente comando
sino va dar `error`

```bash
# Primero obtén el ID de una tarea
TASK_ID=$(curl -s http://localhost:8080/api/tasks | jq -r '.[0]._id')

# Luego consulta esa tarea
curl http://localhost:8080/api/tasks/$TASK_ID
```

#### 8. Actualizar una tarea (marcar como completada)
```bash
# Obtén el ID de una tarea
TASK_ID=$(curl -s http://localhost:8080/api/tasks | jq -r '.[0]._id')

# Actualiza la tarea
curl -X PATCH http://localhost:8080/api/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

#### 9. Actualizar título y descripción de una tarea
```bash
# Obtén el ID de una tarea
TASK_ID=$(curl -s http://localhost:8080/api/tasks | jq -r '.[0]._id')

# Actualiza la tarea
curl -X PATCH http://localhost:8080/api/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Título actualizado",
    "description": "Nueva descripción"
  }'
```

#### 10. Eliminar una tarea
```bash
# Obtén el ID de una tarea
TASK_ID=$(curl -s http://localhost:8080/api/tasks | jq -r '.[0]._id')

# Elimina la tarea
curl -X DELETE http://localhost:8080/api/tasks/$TASK_ID
```

---

### 📊 Analytics Service

#### 1. Health Check
```bash
curl http://localhost:3002/health
```

#### 2. Obtener estadísticas generales
```bash
curl http://localhost:3002/api/analytics/stats
```

#### 3. Obtener estadísticas (formato legible)
```bash
curl -s http://localhost:3002/api/analytics/stats | jq
```

#### 4. Obtener tareas agrupadas por prioridad
```bash
curl http://localhost:3002/api/analytics/tasks-by-priority
```

#### 5. Obtener tareas por prioridad (formato legible)
```bash
curl -s http://localhost:3002/api/analytics/tasks-by-priority | jq
```

#### 6. Ver estado del Circuit Breaker
```bash
curl http://localhost:3002/api/analytics/circuit-breaker
```

#### 7. Resetear Circuit Breaker
```bash
curl -X POST http://localhost:3002/api/analytics/circuit-breaker/reset
```

---

### 🧪 Pruebas de Patrones de Resiliencia

#### Probar Load Balancing (varias peticiones)
```bash
# Ejecutar 10 peticiones y ver qué instancia responde
for i in {1..10}; do
  echo "Request $i:"
  curl -s http://localhost:8080/health | jq -r '.instance'
done
```

#### Crear múltiples tareas rápidamente
```bash
# Crear 5 tareas para pruebas
for i in {1..5}; do
  curl -X POST http://localhost:8080/api/tasks \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Tarea automatizada $i\",
      \"description\": \"Creada automáticamente para pruebas\",
      \"priority\": \"medium\"
    }" && echo ""
done
```

#### Probar Circuit Breaker

**Paso 1: Verificar estado normal**
```bash
curl -s http://localhost:3002/api/analytics/circuit-breaker | jq
```

**Paso 2: Detener Tasks Service para forzar errores**
```bash
docker compose stop tasks-service-1 tasks-service-2
```

**Paso 3: Hacer múltiples peticiones para abrir el circuito**
```bash
for i in {1..6}; do
  echo "Attempt $i:"
  curl -s http://localhost:3002/api/analytics/stats | jq '.circuitBreakerState'
  sleep 1
done
```

**Paso 4: Verificar que el circuito está abierto**
```bash
curl -s http://localhost:3002/api/analytics/circuit-breaker | jq
```

**Paso 5: Reiniciar Tasks Service**
```bash
docker compose start tasks-service-1 tasks-service-2
```

**Paso 6: Esperar y verificar recuperación**
```bash
sleep 65  # Esperar el timeout del circuit breaker
curl -s http://localhost:3002/api/analytics/stats | jq
```

---

### 📈 Monitoreo Continuo

#### Ver logs en tiempo real
```bash
# Todos los servicios
docker compose logs -f

# Solo Analytics Service
docker compose logs -f analytics-service

# Solo Tasks Services
docker compose logs -f tasks-service-1 tasks-service-2
```

#### Estadísticas cada 5 segundos
```bash
watch -n 5 'curl -s http://localhost:3002/api/analytics/stats | jq'
```

---

## 🏛️ Arquitectura

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
└──────┬──────────────────────────────────────────────┘
       ├──────────────────────┬──────────────────┐
       ▼                      ▼                  ▼
┌─────────────────────┐ ┌───────────────────┐    │
│Tasks Service   (A)  │ │Tasks Service (A)  │    │
│  Réplica 1          │ │  Réplica 2        │    │
│ (Puerto: 3001)      │ │ (Puerto: 3001)    │    │
└──────┬──────────────┘ └──────┬────────────┘    │
       │                       │                 │
       └────────┬──────────────┘                 │
                ▼                                ▼
         ┌──────────────┐          ┌──────────────────┐
         │  MongoDB     │          │  Analytics       │
         │  Tasks DB    │◄─────────│   Service (B)    │ ◄─ HTTP + Retry + Circuit Breaker
         └──────────────┘          └──────────────────┘
                                    (Puerto 3002)
```

---


## 🗄️ Base de Datos

### MongoDB
- **Tasks Service**: Puerto 27017
- **Base de datos**: `tasks-db`
- **Persistencia**: Volumen Docker `mongodb-tasks-data`

Los datos persisten entre reinicios. Para limpiar datos:
```bash
docker compose down -v
```

---


## 📊 Monitoreo

### Ver estado de contenedores
```bash
docker compose ps
```

### Ver logs en tiempo real
```bash
docker compose logs -f
```



### Inspeccionar un contenedor específico
```bash
docker compose exec tasks-service-1 sh
```

---

## 🔍 Monitoreo de Kafka

### Ver mensajes en tiempo real
```bash
# Consumir mensajes del topic task-created
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic task-created \
  --from-beginning

# Ver todos los topics
docker exec -it kafka kafka-topics --bootstrap-server localhost:9092 --list
```

### Ver consumer groups
```bash
docker exec -it kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe \
  --group analytics-service-group
```

### Ver eventos procesados por Analytics
```bash
# Eventos recientes
curl http://localhost:3002/api/analytics/events?limit=10 | jq

# Ver logs del consumer
docker compose logs -f analytics-service | grep "Received event"
```

---

## 🐛 Troubleshooting
# Verificar estado de MongoDB
docker compose logs mongodb-tasks

# Reiniciar MongoDB
docker compose restart mongodb-tasks
```

---

## 📦 Variables de Entorno

Todas las variables de entorno están configuradas en `docker-compose.yml`:

### Tasks Service
| Variable | Valor | Descripción |
|----------|-------|-------------|
| `PORT` | 3001 | Puerto del servicio |
| `MONGODB_URI` | mongodb://mongodb-tasks:27017/tasks-db | URI de conexión a MongoDB |
| `INSTANCE_NAME` | tasks-service-1/2 | Nombre de la instancia |
| `NODE_ENV` | development | Entorno de ejecución |
| `TZ` | America/La_Paz | Zona horaria |

### Analytics Service
| Variable | Valor | Descripción |
|----------|-------|-------------|
| `PORT` | 3002 | Puerto del servicio |
| `TASKS_SERVICE_URL` | http://nginx-lb | URL del Tasks Service |
| `NODE_ENV` | development | Entorno de ejecución |
| `TZ` | America/La_Paz | Zona horaria |
| `CIRCUIT_BREAKER_THRESHOLD` | 5 | Umbral de fallos para abrir circuito |
| `CIRCUIT_BREAKER_TIMEOUT` | 60000 | Timeout en ms para cerrar circuito |
| `RETRY_ATTEMPTS` | 3 | Número de reintentos |
| `RETRY_DELAY` | 1000 | Delay inicial entre reintentos (ms) |
| `KAFKA_BROKER` | kafka:9092 | Broker de Kafka |
| `KAFKA_ENABLED` | true | Habilitar Kafka |
| `KAFKA_GROUP_ID` | analytics-service-group | Consumer group ID |

### Tasks Service (Kafka)
| Variable | Valor | Descripción |
|----------|-------|-------------|
| `KAFKA_BROKER` | kafka:9092 | Broker de Kafka |
| `KAFKA_ENABLED` | true | Habilitar publicación de eventos |

---

## 📚 Documentación Adicional

- **[KAFKA_README.md](KAFKA_README.md)** - Guía completa de Event-Driven Architecture con Kafka
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Diagramas detallados de la arquitectura del sistema

---

**UCB - Maestría en Desarrollo de Software**  
**Wilver Vargas**  
Arquitectura de Microservicios - Prácticas 1 y 2

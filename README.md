# 🚀 Proyecto Microservicios - Reuniones

## 📌 Práctica 1: Microservicios con Patrones de Resiliencia

**Universidad:** UCB - Maestría en Desarrollo de Software  
**Materia:** Arquitectura de Microservicios  


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
- Tasks Service: http://localhost:8080/api (a través del Load Balancer)
- Analytics Service: http://localhost:3002/api

---

### Requisitos Previos

Asegúrate de tener instalado:
- **Docker** (versión 20.10 o superior) - incluye Docker Compose V2

Para verificar las versiones:
```bash
docker --version
docker compose version
```

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
- Inicia MongoDB, Tasks Service (2 réplicas), NGINX Load Balancer y Analytics Service
- Crea la red y volúmenes necesarios
- Ejecuta todo en segundo plano

#### 3. Verificar que los servicios están corriendo
```bash
docker compose ps
```

Deberías ver todos los servicios con estado `Up` y `healthy`.

#### 4. Ver los logs (opcional)
```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f tasks-service-1
docker compose logs -f analytics-service
```

#### 5. Detener todos los servicios
```bash
# Detener y remover contenedores
docker compose down

# Detener y eliminar también los volúmenes (datos de MongoDB)
docker compose down -v
```

---

## 🏗️ Estructura del Proyecto

```
ucb_microservices/
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
└── docker compose.yml     # Orquestación completa
```

---

## 🌐 Endpoints Disponibles

### Tasks Service (a través del Load Balancer - Puerto 8080)
**Base URL:** `http://localhost:8080`

- `GET /api/tasks` - Obtener todas las tareas
- `POST /api/tasks` - Crear una nueva tarea
- `GET /api/tasks/:id` - Obtener tarea por ID
- `PATCH /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea
- `GET /health` - Health check

**Swagger UI:** http://localhost:8080/api

### Analytics Service (Puerto 3002)
**Base URL:** `http://localhost:3002`

- `GET /api/analytics/stats` - Estadísticas generales
- `GET /api/analytics/tasks-by-priority` - Tareas agrupadas por prioridad
- `GET /api/analytics/circuit-breaker` - Estado del Circuit Breaker
- `GET /health` - Health check

**Swagger UI:** http://localhost:3002/api

---

## 🧪 Pruebas con cURL (Copiar y Pegar)

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
curl http://localhost:8080/api/tasks
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




### MongoDB no se conecta
```bash
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


---


**UCB - Maestría en Desarrollo de Software**  
**Wilver Vargas**
Arquitectura de Microservicios - Práctica 1

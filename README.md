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
- Tasks Service: http://localhost/api (a través del Load Balancer)
- Analytics Service: http://localhost:3002/api

---

## 🚀 Inicio Rápido

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

## 📚 Comandos Útiles de Docker Compose

```bash
# Levantar servicios
docker compose up -d --build          # Construir y ejecutar en background
docker compose up                     # Ejecutar en foreground (ver logs en vivo)

# Ver estado
docker compose ps                     # Estado de contenedores
docker compose logs -f                # Ver logs en tiempo real
docker compose logs -f [servicio]     # Logs de un servicio específico

# Reconstruir un servicio específico
docker compose up -d --build tasks-service-1

# Detener y limpiar
docker compose down                   # Detener y remover contenedores
docker compose down -v                # + remover volúmenes (datos)
docker compose restart                # Reiniciar servicios

# Ejecutar comandos dentro de un contenedor
docker compose exec tasks-service-1 sh
docker compose exec mongodb-tasks mongosh
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

### Tasks Service (a través del Load Balancer - Puerto 80)
**Base URL:** `http://localhost`

- `GET /api/tasks` - Obtener todas las tareas
- `POST /api/tasks` - Crear una nueva tarea
- `GET /api/tasks/:id` - Obtener tarea por ID
- `PATCH /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea
- `GET /health` - Health check

**Swagger UI:** http://localhost/api

### Analytics Service (Puerto 3002)
**Base URL:** `http://localhost:3002`

- `GET /api/analytics/stats` - Estadísticas generales
- `GET /api/analytics/tasks-by-priority` - Tareas agrupadas por prioridad
- `GET /health` - Health check

**Swagger UI:** http://localhost:3002/api

---

## 🧪 Pruebas Rápidas

### Crear una tarea
```bash
curl -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi primera tarea",
    "description": "Descripción de prueba",
    "priority": "high",
    "status": "pending"
  }'
```

### Listar todas las tareas
```bash
curl http://localhost/api/tasks
```

### Obtener estadísticas
```bash
curl http://localhost:3002/api/analytics/stats
```

### Obtener tareas por prioridad
```bash
curl http://localhost:3002/api/analytics/tasks-by-priority
```

### Verificar health checks
```bash
# Tasks Service (a través del Load Balancer)
curl http://localhost/health

# Analytics Service
curl http://localhost:3002/health
```

---

## 🏛️ Arquitectura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  NGINX Load Balancer│  (Puerto 80)
│   (Round Robin)     │
└──────┬──────────────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐  │
│Tasks Service │ │Tasks Service │  │
│  Réplica 1   │ │  Réplica 2   │  │
└──────┬───────┘ └──────┬───────┘  │
       │                │           │
       └────────┬───────┘           │
                ▼                   ▼
         ┌──────────────┐   ┌──────────────┐
         │  MongoDB     │   │  Analytics   │
         │  Tasks DB    │◄──│   Service    │
         └──────────────┘   └──────────────┘
                              (Puerto 3002)
```

---

## 🛡️ Patrones de Resiliencia Implementados

### 1. Circuit Breaker
Protege contra fallos en cascada cuando el Tasks Service no responde:
- **Estados**: CLOSED → OPEN → HALF_OPEN
- **Configuración**: 
  - Umbral de fallos: 5
  - Timeout de apertura: 60 segundos

### 2. Retry Pattern
Reintentos automáticos con backoff exponencial:
- **Reintentos**: 3 intentos
- **Backoff**: Exponencial (1s, 2s, 4s)

### 3. Load Balancing
NGINX distribuye peticiones entre 2 réplicas del Tasks Service:
- **Algoritmo**: Round Robin
- **Health checks**: Cada 10 segundos

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

## 🔧 Desarrollo Local (Opcional)

Si deseas desarrollar sin Docker:

### Tasks Service
```bash
cd tasks-service
npm install
npm run start:dev
```

### Analytics Service
```bash
cd analytics-service
npm install
npm run start:dev
```

**Nota:** Necesitarás MongoDB corriendo localmente en `mongodb://localhost:27017`

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

### Ver estadísticas de recursos
```bash
docker stats
```

### Inspeccionar un contenedor específico
```bash
docker compose exec tasks-service-1 sh
```

---

## 🐛 Troubleshooting

### Los servicios no levantan
```bash
# Ver logs detallados
docker compose logs

# Reconstruir desde cero
docker compose down -v
docker compose up -d --build
```

### Puerto 80 ya está en uso
Si tienes otro servicio usando el puerto 80 (como Apache/Nginx local):
1. Detén el servicio local: `sudo systemctl stop nginx` o `sudo systemctl stop apache2`
2. O modifica el puerto en `docker compose.yml` cambiando `"80:80"` a `"8080:80"`
3. Accede entonces en: http://localhost:8080

### MongoDB no se conecta
```bash
# Verificar estado de MongoDB
docker compose logs mongodb-tasks

# Reiniciar MongoDB
docker compose restart mongodb-tasks
```

---

## 📦 Variables de Entorno

Configurables en `docker compose.yml`:

| Variable | Servicio | Descripción |
|----------|----------|-------------|
| `PORT` | Tasks/Analytics | Puerto del servicio |
| `MONGODB_URI` | Tasks | URI de conexión a MongoDB |
| `TASKS_SERVICE_URL` | Analytics | URL del Tasks Service |
| `INSTANCE_NAME` | Tasks | Nombre de la instancia |

---

## 👥 Autor

**UCB - Maestría en Desarrollo de Software**  
Arquitectura de Microservicios - Práctica 1

---

## 📄 Licencia

Este proyecto es parte de una práctica académica de la UCB.

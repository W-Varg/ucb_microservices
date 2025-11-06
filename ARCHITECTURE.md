# Diagrama de Arquitectura - Proyecto Reuniones

## 📊 Arquitectura Completa

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE                                     │
│                         (Browser, cURL, etc)                            │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      NGINX LOAD BALANCER                                │
│                         (Puerto 80)                                      │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Configuración:                                                 │    │
│  │  - Round-robin load balancing                                  │    │
│  │  - Health checks automáticos                                   │    │
│  │  - Timeout: 60 segundos                                        │    │
│  │  - Keepalive: 32 conexiones                                    │    │
│  └────────────────────────────────────────────────────────────────┘    │
└──────┬────────────────────────────────────────────┬─────────────────────┘
       │                                            │
       │ /api/tasks                                 │ /api/tasks
       │ /health                                    │ /health
       │                                            │
       ▼                                            ▼
┌──────────────────────┐                  ┌──────────────────────┐
│  TASKS SERVICE 1     │                  │  TASKS SERVICE 2     │
│    (Réplica 1)       │                  │    (Réplica 2)       │
│                      │                  │                      │
│  Framework: NestJS   │                  │  Framework: NestJS   │
│  Puerto: 3001        │                  │  Puerto: 3001        │
│  Instancia: A1       │                  │  Instancia: A2       │
│                      │                  │                      │
│  Endpoints:          │                  │  Endpoints:          │
│  - GET /api/tasks    │                  │  - GET /api/tasks    │
│  - POST /api/tasks   │                  │  - POST /api/tasks   │
│  - PATCH /api/tasks  │                  │  - PATCH /api/tasks  │
│  - DELETE /api/tasks │                  │  - DELETE /api/tasks │
│  - GET /health       │                  │  - GET /health       │
│                      │                  │                      │
└──────────┬───────────┘                  └──────────┬───────────┘
           │                                         │
           │                                         │
           └─────────────────┬───────────────────────┘
                             │
                             │ MongoDB Connection
                             │
                             ▼
                    ┌─────────────────┐
                    │  MONGODB TASKS  │
                    │                 │
                    │ Puerto: 27017   │
                    │ DB: tasks-db    │
                    │                 │
                    │ Collections:    │
                    │ - tasks         │
                    │                 │
                    │ Volumen:        │
                    │ mongodb-tasks   │
                    └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                     ANALYTICS SERVICE (Servicio B)                      │
│                            Puerto: 3002                                  │
│                                                                          │
│  Framework: NestJS                                                      │
│  Comunicación: HTTP (Síncrono)                                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Patrones Implementados:                                        │    │
│  │                                                                  │    │
│  │  🔄 RETRY PATTERN                                               │    │
│  │     - 3 reintentos automáticos                                  │    │
│  │     - Backoff exponencial: 1s → 2s → 4s                        │    │
│  │     - Timeout: 5 segundos por petición                          │    │
│  │                                                                  │    │
│  │  🔌 CIRCUIT BREAKER                                             │    │
│  │     - Estados: CLOSED → OPEN → HALF_OPEN                       │    │
│  │     - Threshold: 3 fallos consecutivos                          │    │
│  │     - Reset timeout: 30 segundos                                │    │
│  │     - Success threshold: 2 éxitos                               │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Endpoints:                                                             │
│  - GET /api/analytics/stats                                             │
│  - GET /api/analytics/tasks-by-priority                                 │
│  - GET /api/analytics/circuit-breaker                                   │
│  - POST /api/analytics/circuit-breaker/reset                            │
│  - GET /health                                                          │
│                                                                          │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             │ HTTP Request
                             │ (Con Retry + Circuit Breaker)
                             │
                             ▼
                    ┌─────────────────┐
                    │  NGINX LB       │
                    │  (Puerto 80)    │
                    └────────┬────────┘
                             │
                             ▼
                    Tasks Service 1 o 2
```

## 🔄 Flujo de Comunicación

### 1. Cliente → Tasks Service (CRUD)

```
Cliente
   │
   │ 1. HTTP Request (POST /api/tasks)
   │
   ▼
NGINX Load Balancer
   │
   │ 2. Round-robin selection
   │
   ├─→ Tasks Service 1 (50% de requests)
   │      │
   │      │ 3. Procesa request
   │      │
   │      ▼
   │   MongoDB
   │      │
   │      │ 4. Save/Read data
   │      │
   │      ▼
   │   Respuesta al cliente
   │
   └─→ Tasks Service 2 (50% de requests)
          │
          │ 3. Procesa request
          │
          ▼
       MongoDB (misma instancia)
          │
          │ 4. Save/Read data
          │
          ▼
       Respuesta al cliente
```

### 2. Analytics Service → Tasks Service (con resiliencia)

```
Cliente
   │
   │ 1. GET /api/analytics/stats
   │
   ▼
Analytics Service
   │
   │ 2. Necesita datos de tareas
   │
   │ ┌────────────────────────────────────┐
   │ │ Circuit Breaker Check              │
   │ │ ¿Estado OPEN?                      │
   │ │   Sí → Bloquear request            │
   │ │   No → Continuar                   │
   │ └────────────────────────────────────┘
   │
   │ 3. HTTP GET http://nginx-lb/api/tasks
   │
   ▼
NGINX Load Balancer
   │
   │ 4. Selecciona instancia
   │
   ▼
Tasks Service 1 o 2
   │
   │ ¿Request exitoso?
   │
   ├─→ SÍ → Respuesta → Analytics procesa → Cliente
   │                     Circuit Breaker: onSuccess()
   │
   └─→ NO → Retry Pattern
              │
              │ Intento 1 (espera 1s)
              │    ¿Exitoso? Sí → Respuesta
              │    No ↓
              │
              │ Intento 2 (espera 2s)
              │    ¿Exitoso? Sí → Respuesta
              │    No ↓
              │
              │ Intento 3 (espera 4s)
              │    ¿Exitoso? Sí → Respuesta
              │    No ↓
              │
              └─→ Error definitivo
                     │
                     ▼
                  Circuit Breaker: onFailure()
                  (cuenta fallos)
                     │
                     │ ¿3 fallos consecutivos?
                     │
                     └─→ SÍ → Estado → OPEN
                            (bloquea requests por 30s)
```

## 🏗️ Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE ENTRADA                       │
│                  (Load Balancer - NGINX)                 │
│  - Distribución de carga                                │
│  - Punto único de entrada                               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  CAPA DE SERVICIOS                       │
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  Tasks Service   │      │ Analytics Service│        │
│  │    (2 réplicas)  │      │   (1 instancia)  │        │
│  │                  │      │                  │        │
│  │  - CRUD tasks    │      │  - Estadísticas  │        │
│  │  - Validación    │      │  - Análisis      │        │
│  │  - Lógica negocio│      │  - Resiliencia   │        │
│  └──────────────────┘      └──────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  CAPA DE DATOS                           │
│                                                          │
│  ┌──────────────────┐                                   │
│  │    MongoDB       │                                   │
│  │   - tasks-db     │                                   │
│  │   - Persistencia │                                   │
│  └──────────────────┘                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Patrones de Resiliencia - Estados

### Circuit Breaker - Máquina de Estados

```
           Inicio
             │
             ▼
      ┌────────────┐
      │   CLOSED   │ ◄──────────────┐
      │  (Normal)  │                │
      └─────┬──────┘                │
            │                       │
            │ 3 fallos              │ 2 éxitos
            │ consecutivos          │ en HALF_OPEN
            │                       │
            ▼                       │
      ┌────────────┐                │
      │    OPEN    │                │
      │ (Bloquea)  │                │
      └─────┬──────┘                │
            │                       │
            │ 30 segundos           │
            │                       │
            ▼                       │
      ┌────────────┐                │
      │ HALF_OPEN  │ ───────────────┘
      │  (Prueba)  │
      └────────────┘
            │
            │ 1 fallo
            │
            └──────────┐
                       ▼
                 ┌────────────┐
                 │    OPEN    │
                 │            │
                 └────────────┘
```

## 📦 Contenedores Docker

```
┌─────────────────────────────────────────────────────────┐
│              Docker Compose Network                      │
│            (microservices-network)                       │
│                                                          │
│  ┌────────────────────┐  ┌────────────────────┐        │
│  │ mongodb-tasks      │  │ nginx-lb           │        │
│  │ Image: mongo:7     │  │ Custom Image       │        │
│  │ Port: 27017        │  │ Port: 80           │        │
│  └────────────────────┘  └────────────────────┘        │
│                                                          │
│  ┌────────────────────┐  ┌────────────────────┐        │
│  │ tasks-service-1    │  │ tasks-service-2    │        │
│  │ Custom Image       │  │ Custom Image       │        │
│  │ Internal Port:3001 │  │ Internal Port:3001 │        │
│  └────────────────────┘  └────────────────────┘        │
│                                                          │
│  ┌────────────────────┐                                 │
│  │ analytics-service  │                                 │
│  │ Custom Image       │                                 │
│  │ Port: 3002         │                                 │
│  └────────────────────┘                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🌐 Puertos y Endpoints

```
Puerto 80 (Host → nginx-lb)
   │
   ├─→ /api/tasks        → Tasks Service (balanceado)
   ├─→ /health           → Tasks Service (balanceado)
   └─→ /nginx-status     → NGINX status

Puerto 3001 (Interno)
   │
   ├─→ tasks-service-1
   └─→ tasks-service-2
        │
        ├─→ /api/tasks         → CRUD operations
        ├─→ /api/tasks/:id     → Operations by ID
        ├─→ /health            → Health check
        └─→ /api               → Swagger UI

Puerto 3002 (Host → analytics-service)
   │
   ├─→ /api/analytics/stats              → Estadísticas
   ├─→ /api/analytics/tasks-by-priority  → Tareas por prioridad
   ├─→ /api/analytics/circuit-breaker    → Estado del CB
   ├─→ /health                            → Health check
   └─→ /api                               → Swagger UI

Puerto 27017 (Host → mongodb-tasks)
   │
   └─→ Database: tasks-db
        └─→ Collection: tasks
```

## 🔄 Ciclo de Vida de una Request

### Request Normal (Exitosa)

```
1. Cliente envía: POST /api/tasks
         ↓
2. NGINX recibe request
         ↓
3. Round-robin: Selecciona tasks-service-1
         ↓
4. tasks-service-1 valida datos
         ↓
5. Guarda en MongoDB
         ↓
6. MongoDB confirma
         ↓
7. tasks-service-1 responde 201 Created
         ↓
8. NGINX envía respuesta al cliente
         ↓
9. Cliente recibe respuesta exitosa
```

### Request con Fallo (Retry exitoso)

```
1. Analytics Service: GET /api/analytics/stats
         ↓
2. Hace HTTP GET a NGINX LB
         ↓
3. NGINX → tasks-service-1
         ↓
4. tasks-service-1 falla (timeout)
         ↓
5. Retry Pattern: Intento 1
         ↓
6. Espera 1 segundo
         ↓
7. NGINX → tasks-service-2 (round-robin)
         ↓
8. tasks-service-2 responde OK
         ↓
9. Analytics procesa datos
         ↓
10. Responde al cliente con estadísticas
```

### Request con Múltiples Fallos (Circuit Breaker)

```
1. Analytics Service: GET /api/analytics/stats
         ↓
2. Circuit Breaker estado: CLOSED
         ↓
3. HTTP GET → falla después de 3 reintentos
         ↓
4. Circuit Breaker: failureCount = 1
         ↓
5. Cliente hace otra request
         ↓
6. HTTP GET → falla después de 3 reintentos
         ↓
7. Circuit Breaker: failureCount = 2
         ↓
8. Cliente hace otra request
         ↓
9. HTTP GET → falla después de 3 reintentos
         ↓
10. Circuit Breaker: failureCount = 3
         ↓
11. Circuit Breaker estado: OPEN
         ↓
12. Cliente hace otra request
         ↓
13. Circuit Breaker bloquea inmediatamente
         ↓
14. Responde error sin intentar HTTP request
         ↓
15. Después de 30 segundos → HALF_OPEN
         ↓
16. Permite requests de prueba
```

---

**Proyecto**: Microservicios con Patrones de Resiliencia  
**Autor**: UCB - Maestría en Desarrollo de Software

# Patrones de Resiliencia Implementados

## 1. Retry Pattern (Patrón de Reintentos)

### ¿Qué es?
El Retry Pattern reintenta automáticamente una operación fallida un número determinado de veces antes de declararla como error definitivo.

### Implementación en el Proyecto

**Archivo**: `analytics-service/src/common/http-client.service.ts`

```typescript
retry({
  count: retries,  // Número de reintentos (default: 3)
  delay: (error, retryCount) => {
    // Backoff exponencial: 1s, 2s, 4s, 8s...
    const backoffDelay = retryDelay * Math.pow(2, retryCount - 1);
    return of(error).pipe(delay(backoffDelay));
  },
})
```

### Características
- ✅ **Reintentos configurables**: 3 por defecto
- ✅ **Backoff exponencial**: Aumenta el tiempo entre reintentos (1s → 2s → 4s)
- ✅ **Timeout por petición**: 5 segundos máximo
- ✅ **Logging detallado**: Registra cada intento

### Flujo

```
Petición inicial
    ↓
¿Exitosa? → Sí → Devolver resultado
    ↓ No
Esperar 1 segundo
    ↓
Reintento 1
    ↓
¿Exitosa? → Sí → Devolver resultado
    ↓ No
Esperar 2 segundos
    ↓
Reintento 2
    ↓
¿Exitosa? → Sí → Devolver resultado
    ↓ No
Esperar 4 segundos
    ↓
Reintento 3
    ↓
¿Exitosa? → Sí → Devolver resultado
    ↓ No
Error definitivo
```

### Ejemplo de Logs

```
[HttpClientService] Making GET request to: http://nginx-lb/api/tasks
[HttpClientService] ❌ Request failed - attempting retry 1/3
[HttpClientService] Retry attempt 1/3 for http://nginx-lb/api/tasks after 1000ms
[HttpClientService] ❌ Request failed - attempting retry 2/3
[HttpClientService] Retry attempt 2/3 for http://nginx-lb/api/tasks after 2000ms
[HttpClientService] ✅ Success: GET http://nginx-lb/api/tasks - Status: 200
```

---

## 2. Circuit Breaker Pattern (Patrón de Cortocircuito)

### ¿Qué es?
El Circuit Breaker protege el sistema contra fallos en cascada bloqueando peticiones cuando un servicio está fallando constantemente.

### Estados del Circuit Breaker

```
           ┌─────────────┐
     ┌────►│   CLOSED    │────┐
     │     │  (Normal)   │    │ 3 fallos consecutivos
     │     └─────────────┘    │
     │                        ▼
     │                 ┌─────────────┐
2 éxitos              │    OPEN     │
en HALF_OPEN          │  (Bloquea)  │
     │                └──────┬──────┘
     │                       │
     │                       │ 30 segundos
     │                       │
     │                       ▼
     │                ┌─────────────┐
     └────────────────│ HALF_OPEN   │
                      │  (Prueba)   │
                      └─────────────┘
```

### Configuración

```typescript
failureThreshold = 3;      // Fallos para abrir circuito
resetTimeout = 30000;       // 30 segundos hasta HALF_OPEN
successThreshold = 2;       // Éxitos para cerrar circuito
```

### Estados Detallados

#### 🟢 CLOSED (Cerrado - Estado Normal)
- Las peticiones pasan normalmente
- Se monitorean los fallos
- Si hay 3 fallos consecutivos → Transición a OPEN

#### 🔴 OPEN (Abierto - Bloqueando)
- Todas las peticiones son bloqueadas inmediatamente
- No se intenta conectar al servicio
- Después de 30 segundos → Transición a HALF_OPEN
- **Ventaja**: Evita sobrecargar un servicio que está fallando

#### 🟡 HALF_OPEN (Semi-abierto - Probando)
- Permite pasar algunas peticiones de prueba
- Si 2 peticiones tienen éxito → Vuelve a CLOSED
- Si alguna falla → Vuelve a OPEN
- **Ventaja**: Permite recuperación automática

### Implementación

**Archivo**: `analytics-service/src/common/http-client.service.ts`

```typescript
private async executeWithCircuitBreaker<T>(
  request: () => Promise<T>,
  url: string
): Promise<T> {
  // Check circuit state
  if (this.circuitState === CircuitState.OPEN) {
    const now = Date.now();
    if (now - this.lastFailureTime >= this.resetTimeout) {
      this.circuitState = CircuitState.HALF_OPEN;
    } else {
      throw new Error('Circuit breaker is OPEN - request blocked');
    }
  }

  try {
    const result = await request();
    this.onSuccess();
    return result;
  } catch (error) {
    this.onFailure();
    throw error;
  }
}
```

### Ejemplo de Uso

```bash
# 1. Ver estado inicial (CLOSED)
curl http://localhost:3002/api/analytics/circuit-breaker
# Respuesta: {"state":"CLOSED","timestamp":"..."}

# 2. Detener Tasks Service para forzar fallos
docker stop tasks-service-1 tasks-service-2

# 3. Intentar obtener estadísticas (fallará 3 veces)
curl http://localhost:3002/api/analytics/stats
# Logs mostrarán 3 reintentos y luego circuito se abre

# 4. Ver que el circuito está abierto
curl http://localhost:3002/api/analytics/circuit-breaker
# Respuesta: {"state":"OPEN","timestamp":"..."}

# 5. Intentar de nuevo (será bloqueado inmediatamente)
curl http://localhost:3002/api/analytics/stats
# Error: "Circuit breaker is OPEN - request blocked"

# 6. Reiniciar servicios
docker start tasks-service-1 tasks-service-2

# 7. Esperar 30 segundos o reiniciar manualmente
curl -X POST http://localhost:3002/api/analytics/circuit-breaker/reset

# 8. Verificar que volvió a CLOSED
curl http://localhost:3002/api/analytics/circuit-breaker
# Respuesta: {"state":"CLOSED","timestamp":"..."}
```

### Logs del Circuit Breaker

```
[HttpClientService] Making GET request to: http://nginx-lb/api/tasks
[HttpClientService] ❌ Request failed after 3 retries
[HttpClientService] 🔴 Circuit transitioning to OPEN state - Too many failures
[HttpClientService] ❌ Circuit OPEN: http://nginx-lb/api/tasks
[AnalyticsService] Failed to fetch statistics: Circuit breaker is OPEN - request blocked
```

Después de 30 segundos:
```
[HttpClientService] Circuit transitioning to HALF_OPEN state
[HttpClientService] Making GET request to: http://nginx-lb/api/tasks
[HttpClientService] ✅ Success: GET http://nginx-lb/api/tasks - Status: 200
[HttpClientService] ✅ Circuit transitioning to CLOSED state
```

---

## 3. Load Balancing Pattern (Patrón de Balanceo de Carga)

### ¿Qué es?
Distribuye las peticiones entrantes entre múltiples instancias de un servicio para optimizar recursos y proporcionar alta disponibilidad.

### Implementación: NGINX Round-Robin

**Archivo**: `nginx-lb/nginx.conf`

```nginx
upstream tasks_backend {
    server tasks-service-1:3001;
    server tasks-service-2:3001;
    keepalive 32;
}
```

### Algoritmo: Round-Robin

```
Petición 1 → tasks-service-1
Petición 2 → tasks-service-2
Petición 3 → tasks-service-1
Petición 4 → tasks-service-2
Petición 5 → tasks-service-1
...
```

### Características

- ✅ **Distribución equitativa**: Alterna entre instancias
- ✅ **Failover automático**: Si una instancia falla, usa la otra
- ✅ **Health checks**: Verifica que las instancias estén activas
- ✅ **Keepalive connections**: Reutiliza conexiones (mejor rendimiento)

### Ventajas

1. **Alta Disponibilidad**: Si una instancia falla, la otra continúa
2. **Mejor Rendimiento**: Distribuye la carga computacional
3. **Escalabilidad**: Fácil agregar más instancias
4. **Sin Single Point of Failure**: No depende de una sola instancia

### Verificar Load Balancing

```bash
# Ejecutar múltiples peticiones y ver qué instancia responde
for i in {1..10}; do
  echo "Petición $i:"
  curl -s http://localhost/health | grep -o '"instance":"[^"]*"'
done
```

**Salida esperada**:
```
Petición 1: "instance":"tasks-service-1"
Petición 2: "instance":"tasks-service-2"
Petición 3: "instance":"tasks-service-1"
Petición 4: "instance":"tasks-service-2"
Petición 5: "instance":"tasks-service-1"
...
```

### Configuración Avanzada

```nginx
upstream tasks_backend {
    # Weights (prioridad)
    server tasks-service-1:3001 weight=2;  # Recibe 2x más tráfico
    server tasks-service-2:3001 weight=1;
    
    # Least connections (menos conexiones activas)
    least_conn;
    
    # IP Hash (misma IP → misma instancia)
    ip_hash;
    
    # Health checks
    keepalive 32;
}
```

---

## Combinación de Patrones

### Flujo Completo

```
Cliente hace petición
    ↓
NGINX Load Balancer (Round-robin)
    ↓
Selecciona Tasks Service 1 o 2
    ↓
¿Petición exitosa?
    ↓ No
    ├─→ Retry Pattern (3 intentos con backoff)
    │   ├─→ Intento 1 (espera 1s)
    │   ├─→ Intento 2 (espera 2s)
    │   └─→ Intento 3 (espera 4s)
    ↓
¿Todos los intentos fallaron?
    ↓ Sí
Circuit Breaker cuenta fallo
    ↓
¿3 fallos consecutivos?
    ↓ Sí
Circuit Breaker → OPEN
    ↓
Bloquea peticiones futuras por 30s
    ↓
Después de 30s → HALF_OPEN
    ↓
Permite peticiones de prueba
    ↓
¿2 peticiones exitosas?
    ↓ Sí
Circuit Breaker → CLOSED (Normal)
```

---

## Beneficios de la Implementación

### 🛡️ Resiliencia
- Sistema tolera fallos temporales
- No se cae si un servicio falla
- Recuperación automática

### ⚡ Performance
- Load balancing distribuye carga
- Retry evita fallos transitorios
- Timeouts previenen bloqueos

### 📊 Observabilidad
- Logs detallados de cada operación
- Estado del circuit breaker expuesto
- Métricas de instancias en headers

### 🔧 Mantenibilidad
- Patrones estándar de la industria
- Código modular y reutilizable
- Fácil de configurar y ajustar

---

## Testing de Patrones

### Test 1: Retry Pattern

```bash
# 1. Detener temporalmente una instancia
docker stop tasks-service-1

# 2. Hacer petición (load balancer intentará con la otra)
curl http://localhost:3002/api/analytics/stats

# 3. Ver logs del retry
docker-compose logs analytics-service

# 4. Reiniciar instancia
docker start tasks-service-1
```

### Test 2: Circuit Breaker

```bash
# 1. Detener TODAS las instancias de Tasks Service
docker stop tasks-service-1 tasks-service-2

# 2. Hacer 3+ peticiones para abrir el circuito
for i in {1..5}; do
  curl http://localhost:3002/api/analytics/stats
  sleep 2
done

# 3. Ver estado (debe estar OPEN)
curl http://localhost:3002/api/analytics/circuit-breaker

# 4. Intentar más peticiones (serán bloqueadas inmediatamente)
curl http://localhost:3002/api/analytics/stats
# Error: "Circuit breaker is OPEN - request blocked"

# 5. Reiniciar servicios y circuit breaker
docker start tasks-service-1 tasks-service-2
curl -X POST http://localhost:3002/api/analytics/circuit-breaker/reset
```

### Test 3: Load Balancing

```bash
# Ejecutar múltiples peticiones concurrentes
for i in {1..20}; do
  curl -s http://localhost/health | grep instance &
done | sort | uniq -c

# Resultado esperado (aproximadamente 50/50):
# 10 "instance":"tasks-service-1"
# 10 "instance":"tasks-service-2"
```

---

## Métricas y Monitoreo

### Endpoints de Monitoreo

```bash
# Health check con información de instancia
curl http://localhost/health

# Estado del circuit breaker
curl http://localhost:3002/api/analytics/circuit-breaker

# Estadísticas (incluye estado del circuit breaker)
curl http://localhost:3002/api/analytics/stats
```

### Logs Importantes

```bash
# Ver logs de retry y circuit breaker
docker-compose logs -f analytics-service | grep -E "Retry|Circuit"

# Ver distribución de load balancer
docker-compose logs -f nginx-lb

# Ver logs de instancias específicas
docker-compose logs -f tasks-service-1
docker-compose logs -f tasks-service-2
```

---

## Referencias

- [Microsoft: Retry Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/retry)
- [Microsoft: Circuit Breaker Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [NGINX: Load Balancing](https://www.nginx.com/resources/glossary/load-balancing/)
- [Martin Fowler: Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html)

---

**Autor**: UCB - Maestría en Desarrollo de Software  
**Proyecto**: Microservicios con Patrones de Resiliencia

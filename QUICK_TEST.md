# 🧪 Verificación Rápida del Proyecto

Este documento te ayudará a verificar que todo funciona correctamente después de clonar el repositorio.

## ✅ Checklist Pre-Ejecución

Antes de ejecutar, verifica:
- [ ] Docker está instalado: `docker --version`
- [ ] Docker Compose V2 está incluido: `docker compose version`
- [ ] Puerto 80 está libre (o modifica en docker compose.yml)
- [ ] Puerto 3002 está libre

## 🚀 Pasos de Verificación

### 1. Clonar y entrar al proyecto
```bash
git clone https://github.com/W-Varg/ucb_microservices.git
cd ucb_microservices
```

### 2. Levantar todos los servicios
```bash
docker compose up -d --build
```

⏱️ **Tiempo estimado**: 3-5 minutos la primera vez (descarga de imágenes y construcción)

### 3. Verificar que los servicios están corriendo
```bash
docker compose ps
```

**Salida esperada:**
```
NAME                  STATUS    PORTS
analytics-service     Up        0.0.0.0:3002->3002/tcp
mongodb-tasks         Up        0.0.0.0:27017->27017/tcp
nginx-lb              Up        0.0.0.0:80->80/tcp
tasks-service-1       Up
tasks-service-2       Up
```

### 4. Probar los endpoints

#### 4.1 Health Checks
```bash
# Tasks Service (a través del Load Balancer)
curl http://localhost/health

# Analytics Service
curl http://localhost:3002/health
```

**Respuesta esperada**: `{"status":"ok",...}`

#### 4.2 Crear una tarea
```bash
curl -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tarea de prueba",
    "description": "Testing the microservices",
    "priority": "high",
    "status": "pending"
  }'
```

**Respuesta esperada**: JSON con la tarea creada e `_id`

#### 4.3 Listar tareas
```bash
curl http://localhost/api/tasks
```

**Respuesta esperada**: Array con las tareas (incluyendo la que acabas de crear)

#### 4.4 Obtener estadísticas
```bash
curl http://localhost:3002/api/analytics/stats
```

**Respuesta esperada**: 
```json
{
  "total": 1,
  "pending": 1,
  "in_progress": 0,
  "completed": 0
}
```

#### 4.5 Tareas por prioridad
```bash
curl http://localhost:3002/api/analytics/tasks-by-priority
```

**Respuesta esperada**:
```json
{
  "high": 1,
  "medium": 0,
  "low": 0
}
```

### 5. Probar Swagger UI

Abre en tu navegador:
- **Tasks Service**: http://localhost/api
- **Analytics Service**: http://localhost:3002/api

### 6. Verificar Load Balancing

Crea varias tareas y observa los logs para ver que las peticiones se distribuyen:
```bash
docker compose logs -f tasks-service-1 tasks-service-2
```

Luego en otra terminal, crea tareas:
```bash
for i in {1..10}; do
  curl -X POST http://localhost/api/tasks \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Tarea $i\",\"priority\":\"medium\"}";
  echo ""
done
```

Deberías ver logs alternando entre `tasks-service-1` y `tasks-service-2`.

### 7. Probar Resiliencia (Circuit Breaker)

#### Detener el Tasks Service
```bash
docker compose stop tasks-service-1 tasks-service-2
```

#### Intentar obtener estadísticas
```bash
curl http://localhost:3002/api/analytics/stats
```

**Comportamiento esperado**: 
- Primera llamada: intenta 3 veces (retry pattern)
- Siguientes llamadas: Circuit Breaker abierto, falla rápido

#### Reiniciar el Tasks Service
```bash
docker compose start tasks-service-1 tasks-service-2
```

Espera ~60 segundos y el Circuit Breaker se recuperará automáticamente.

### 8. Ver logs
```bash
# Todos los servicios
docker compose logs -f

# Un servicio específico
docker compose logs -f analytics-service
```

### 9. Detener todo
```bash
# Solo detener
docker compose down

# Detener y limpiar datos
docker compose down -v
```

## 🎯 Checklist de Funcionalidades

- [ ] MongoDB levanta correctamente
- [ ] 2 réplicas del Tasks Service están corriendo
- [ ] NGINX Load Balancer funciona
- [ ] Analytics Service está corriendo
- [ ] Se pueden crear tareas (POST)
- [ ] Se pueden listar tareas (GET)
- [ ] Las estadísticas funcionan
- [ ] Swagger UI accesible
- [ ] Load Balancing distribuye peticiones
- [ ] Circuit Breaker se activa al fallar Tasks Service
- [ ] Retry Pattern intenta 3 veces antes de fallar

## 📊 Monitoreo Continuo

### Ver logs en tiempo real
```bash
docker compose logs -f
```

### Ver recursos utilizados
```bash
docker stats
```

### Reiniciar un servicio específico
```bash
docker compose restart tasks-service-1
```

## 🐛 Problemas Comunes

### Puerto 80 ocupado
```bash
# Opción 1: Detener servicio local
sudo systemctl stop nginx
sudo systemctl stop apache2

# Opción 2: Cambiar puerto en docker compose.yml
# Cambiar "80:80" a "8080:80"
```

### Servicios no levantan
```bash
# Ver logs detallados
docker compose logs

# Reconstruir todo
docker compose down -v
docker compose up -d --build
```

### MongoDB no conecta
```bash
# Verificar logs de MongoDB
docker compose logs mongodb-tasks

# Reiniciar MongoDB
docker compose restart mongodb-tasks
```

## ✨ Todo está funcionando cuando...

1. ✅ `docker compose ps` muestra todos los servicios "Up" y "healthy"
2. ✅ Puedes crear y listar tareas
3. ✅ Analytics Service devuelve estadísticas
4. ✅ Swagger UI carga correctamente
5. ✅ Los logs muestran distribución de carga entre réplicas
6. ✅ El Circuit Breaker se activa al detener Tasks Service

---

**¡Felicidades! Tu entorno de microservicios está completamente funcional.** 🎉

# 🚀 Inicio Rápido - Microservicios Reuniones

## ⚡ Comandos Rápidos

### Iniciar el proyecto
```bash
./start.sh
# O manualmente:
docker-compose up --build -d
```

### Ejecutar pruebas
```bash
./test.sh
```

### Detener el proyecto
```bash
./stop.sh
# O manualmente:
docker-compose down
```

## 📍 URLs Principales

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Load Balancer | http://localhost | Punto de entrada principal |
| Tasks API | http://localhost/api/tasks | CRUD de tareas (balanceado) |
| Analytics API | http://localhost:3002/api/analytics/stats | Estadísticas |
| Swagger - Tasks | http://localhost:3001/api | Documentación Tasks Service |
| Swagger - Analytics | http://localhost:3002/api | Documentación Analytics Service |

## 🧪 Pruebas Rápidas con cURL

### 1. Verificar que todo está funcionando
```bash
curl http://localhost/health
curl http://localhost:3002/health
```

### 2. Crear una tarea
```bash
curl -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi primera tarea",
    "description": "Probar los microservicios",
    "priority": "high"
  }'
```

### 3. Listar todas las tareas
```bash
curl http://localhost/api/tasks
```

### 4. Obtener estadísticas
```bash
curl http://localhost:3002/api/analytics/stats
```

### 5. Ver tareas por prioridad
```bash
curl http://localhost:3002/api/analytics/tasks-by-priority
```

### 6. Verificar Load Balancing
```bash
# Ejecutar varias veces y ver que alterna entre instancias
for i in {1..5}; do 
  echo "Request $i:"
  curl -s http://localhost/health | grep -o '"instance":"[^"]*"'
done
```

### 7. Probar Circuit Breaker
```bash
# Ver estado actual
curl http://localhost:3002/api/analytics/circuit-breaker

# Detener Tasks Service para forzar errores
docker stop tasks-service-1 tasks-service-2

# Intentar obtener stats (fallará y abrirá el circuito tras 3 intentos)
curl http://localhost:3002/api/analytics/stats

# Ver que el circuito está abierto
curl http://localhost:3002/api/analytics/circuit-breaker

# Reiniciar servicios
docker start tasks-service-1 tasks-service-2

# Reiniciar circuit breaker
curl -X POST http://localhost:3002/api/analytics/circuit-breaker/reset
```

## 📊 Ver Logs

```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f tasks-service-1
docker-compose logs -f tasks-service-2
docker-compose logs -f analytics-service
docker-compose logs -f nginx-lb
```

## 🐛 Troubleshooting

### Los servicios no inician
```bash
# Ver estado
docker-compose ps

# Ver logs de error
docker-compose logs

# Reiniciar desde cero
docker-compose down -v
docker-compose up --build
```

### Puerto ocupado
```bash
# Ver qué proceso usa el puerto 80
sudo lsof -i :80

# Cambiar puerto en docker-compose.yml
# nginx-lb:
#   ports:
#     - "8080:80"  # Cambiar a puerto 8080
```

### Limpiar todo y empezar de nuevo
```bash
docker-compose down -v
docker system prune -a
./start.sh
```

## 📚 Documentación Completa

- Ver archivo `DOCUMENTATION.md` para documentación técnica detallada
- Ver archivo `README.md` para información general del proyecto

## ✅ Checklist de Validación

- [ ] Load Balancer responde en http://localhost
- [ ] Ambas instancias de Tasks Service están funcionando
- [ ] Analytics Service puede obtener datos de Tasks Service
- [ ] Swagger UI accesible en ambos servicios
- [ ] Load balancing funciona (alterna entre instancias)
- [ ] Circuit breaker se abre tras fallos consecutivos
- [ ] Retry pattern intenta 3 veces antes de fallar

## 🎯 Arquitectura

```
Cliente
   ↓
NGINX Load Balancer (puerto 80)
   ↓
   ├─→ Tasks Service 1 (réplica 1) ─┐
   └─→ Tasks Service 2 (réplica 2) ─┤
                                     ↓
                              MongoDB Tasks
                              
Analytics Service (puerto 3002)
   ↓ (HTTP + Retry + Circuit Breaker)
NGINX Load Balancer
```

## 📦 Estructura de Archivos

```
reuniones/
├── tasks-service/          # Servicio A - Gestión de tareas
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
├── docker-compose.yml     # Orquestación
├── start.sh              # Script de inicio
├── test.sh               # Script de pruebas
└── stop.sh               # Script de parada
```

## 💡 Tips

1. **Usa Swagger UI** para probar endpoints interactivamente
2. **Revisa los logs** para entender el flujo de peticiones
3. **Prueba el Circuit Breaker** deteniendo servicios temporalmente
4. **Verifica Load Balancing** con múltiples peticiones rápidas

---

**¿Problemas?** Revisa `DOCUMENTATION.md` o los logs con `docker-compose logs`

#!/bin/bash

echo "=========================================="
echo "  Pruebas de Microservicios"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para hacer peticiones
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}📡 ${description}${NC}"
    echo "   ${method} ${url}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X ${method} ${url})
    else
        response=$(curl -s -w "\n%{http_code}" -X ${method} -H "Content-Type: application/json" -d "${data}" ${url})
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "   ${GREEN}✅ Status: ${http_code}${NC}"
        echo "   Response: ${body}" | head -c 200
        echo ""
    else
        echo -e "   ${RED}❌ Status: ${http_code}${NC}"
        echo "   Response: ${body}" | head -c 200
        echo ""
    fi
    echo ""
}

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 5
echo ""

# 1. Health checks
echo "=========================================="
echo "  1️⃣  Health Checks"
echo "=========================================="
test_endpoint "GET" "http://localhost/health" "" "Tasks Service Health (via Load Balancer)"
test_endpoint "GET" "http://localhost:3002/health" "" "Analytics Service Health"
echo ""

# 2. Crear tareas
echo "=========================================="
echo "  2️⃣  Crear Tareas"
echo "=========================================="
test_endpoint "POST" "http://localhost/api/tasks" '{"title":"Tarea de Alta Prioridad","description":"Implementar Circuit Breaker","priority":"high"}' "Crear tarea 1"
test_endpoint "POST" "http://localhost/api/tasks" '{"title":"Tarea de Media Prioridad","description":"Implementar Retry Pattern","priority":"medium"}' "Crear tarea 2"
test_endpoint "POST" "http://localhost/api/tasks" '{"title":"Tarea de Baja Prioridad","description":"Documentación","priority":"low"}' "Crear tarea 3"
echo ""

# 3. Obtener todas las tareas
echo "=========================================="
echo "  3️⃣  Obtener Todas las Tareas"
echo "=========================================="
test_endpoint "GET" "http://localhost/api/tasks" "" "Obtener lista de tareas (via Load Balancer)"
echo ""

# 4. Analytics - Estadísticas
echo "=========================================="
echo "  4️⃣  Obtener Estadísticas (Analytics Service)"
echo "=========================================="
test_endpoint "GET" "http://localhost:3002/api/analytics/stats" "" "Estadísticas generales"
echo ""

# 5. Analytics - Tareas por prioridad
echo "=========================================="
echo "  5️⃣  Tareas por Prioridad (Analytics Service)"
echo "=========================================="
test_endpoint "GET" "http://localhost:3002/api/analytics/tasks-by-priority" "" "Tareas agrupadas por prioridad"
echo ""

# 6. Circuit Breaker Status
echo "=========================================="
echo "  6️⃣  Estado del Circuit Breaker"
echo "=========================================="
test_endpoint "GET" "http://localhost:3002/api/analytics/circuit-breaker" "" "Estado del Circuit Breaker"
echo ""

# 7. Prueba de Load Balancing
echo "=========================================="
echo "  7️⃣  Prueba de Load Balancing"
echo "=========================================="
echo -e "${BLUE}📡 Haciendo 5 peticiones para verificar distribución de carga${NC}"
for i in {1..5}
do
    echo "   Petición ${i}:"
    curl -s http://localhost/health | grep -o '"instance":"[^"]*"' || echo "   Sin información de instancia"
done
echo ""
echo ""

echo "=========================================="
echo "  ✅ Pruebas completadas"
echo "=========================================="
echo ""
echo "💡 Puedes acceder a Swagger UI:"
echo "   - Tasks Service: http://localhost:3001/api"
echo "   - Analytics Service: http://localhost:3002/api"
echo ""

#!/bin/bash

# Script de Validación Completa del Proyecto
# Este script verifica que todos los requisitos estén cumplidos

echo "=========================================="
echo "  🔍 VALIDACIÓN DEL PROYECTO"
echo "  Microservicios con Patrones de Resiliencia"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Función para verificar
check() {
    local test_name=$1
    local command=$2
    local expected=$3
    
    echo -n "Verificando: $test_name... "
    
    result=$(eval "$command" 2>/dev/null)
    
    if [[ $result == *"$expected"* ]] || [[ -z "$expected" && $? -eq 0 ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1️⃣  ESTRUCTURA DE ARCHIVOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check "README.md existe" "test -f README.md"
check "docker-compose.yml existe" "test -f docker-compose.yml"
check "tasks-service/Dockerfile existe" "test -f tasks-service/Dockerfile"
check "analytics-service/Dockerfile existe" "test -f analytics-service/Dockerfile"
check "nginx-lb/Dockerfile existe" "test -f nginx-lb/Dockerfile"
check "nginx-lb/nginx.conf existe" "test -f nginx-lb/nginx.conf"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2️⃣  SERVICIOS EN EJECUCIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check "MongoDB está corriendo" "docker ps | grep mongodb-tasks" "mongodb-tasks"
check "Tasks Service 1 está corriendo" "docker ps | grep tasks-service-1" "tasks-service-1"
check "Tasks Service 2 está corriendo" "docker ps | grep tasks-service-2" "tasks-service-2"
check "NGINX Load Balancer está corriendo" "docker ps | grep nginx-lb" "nginx-lb"
check "Analytics Service está corriendo" "docker ps | grep analytics-service" "analytics-service"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3️⃣  HEALTH CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 2  # Dar tiempo a los servicios

check "Load Balancer responde" "curl -s http://localhost/health" "OK"
check "Analytics Service responde" "curl -s http://localhost:3002/health" "OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4️⃣  ENDPOINTS DE TASKS SERVICE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check "GET /api/tasks funciona" "curl -s -o /dev/null -w '%{http_code}' http://localhost/api/tasks" "200"

# Crear una tarea de prueba
TASK_RESPONSE=$(curl -s -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","priority":"high"}')

TASK_ID=$(echo $TASK_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TASK_ID" ]; then
    echo -e "Verificando: POST /api/tasks funciona... ${GREEN}✅ PASS${NC}"
    ((PASSED++))
    
    check "GET /api/tasks/:id funciona" "curl -s -o /dev/null -w '%{http_code}' http://localhost/api/tasks/$TASK_ID" "200"
    check "PATCH /api/tasks/:id funciona" "curl -s -o /dev/null -w '%{http_code}' -X PATCH http://localhost/api/tasks/$TASK_ID -H 'Content-Type: application/json' -d '{\"completed\":true}'" "200"
    check "DELETE /api/tasks/:id funciona" "curl -s -o /dev/null -w '%{http_code}' -X DELETE http://localhost/api/tasks/$TASK_ID" "200"
else
    echo -e "Verificando: POST /api/tasks funciona... ${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  5️⃣  ENDPOINTS DE ANALYTICS SERVICE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check "GET /api/analytics/stats funciona" "curl -s http://localhost:3002/api/analytics/stats" "total"
check "GET /api/analytics/tasks-by-priority funciona" "curl -s http://localhost:3002/api/analytics/tasks-by-priority" "high"
check "GET /api/analytics/circuit-breaker funciona" "curl -s http://localhost:3002/api/analytics/circuit-breaker" "state"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  6️⃣  LOAD BALANCING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -n "Verificando: Load Balancing entre 2 instancias... "

# Hacer 10 peticiones y contar instancias
SERVICE1_COUNT=0
SERVICE2_COUNT=0

for i in {1..10}; do
    INSTANCE=$(curl -s http://localhost/health | grep -o '"instance":"[^"]*"' | cut -d'"' -f4)
    if [[ $INSTANCE == "tasks-service-1" ]]; then
        ((SERVICE1_COUNT++))
    elif [[ $INSTANCE == "tasks-service-2" ]]; then
        ((SERVICE2_COUNT++))
    fi
    sleep 0.2
done

if [ $SERVICE1_COUNT -gt 0 ] && [ $SERVICE2_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "   Tasks Service 1: $SERVICE1_COUNT requests"
    echo "   Tasks Service 2: $SERVICE2_COUNT requests"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Tasks Service 1: $SERVICE1_COUNT requests"
    echo "   Tasks Service 2: $SERVICE2_COUNT requests"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  7️⃣  PATRONES DE RESILIENCIA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar que el código de Retry Pattern existe
check "Código de Retry Pattern existe" "grep -r 'retry.*count.*retries' analytics-service/src/" ""

# Verificar que el código de Circuit Breaker existe
check "Código de Circuit Breaker existe" "grep -r 'CircuitState' analytics-service/src/" ""

# Verificar configuración de NGINX upstream
check "NGINX upstream con 2 servidores" "grep -c 'server tasks-service-[12]:3001' nginx-lb/nginx.conf" "2"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  8️⃣  SWAGGER DOCUMENTATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check "Swagger UI Tasks Service accesible" "curl -s http://localhost:3001/api" "swagger"
check "Swagger UI Analytics Service accesible" "curl -s http://localhost:3002/api" "swagger"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  9️⃣  DOCKER COMPOSE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check "2 réplicas de Tasks Service definidas" "grep -c 'tasks-service-[12]:' docker-compose.yml" "2"
check "NGINX Load Balancer definido" "grep -c 'nginx-lb:' docker-compose.yml" "1"
check "Analytics Service definido" "grep -c 'analytics-service:' docker-compose.yml" "1"
check "MongoDB definido" "grep -c 'mongodb-tasks:' docker-compose.yml" "1"
check "Network definida" "grep -c 'microservices-network' docker-compose.yml" ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔟 DOCUMENTACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check "README.md existe y no está vacío" "test -s README.md"
check "DOCUMENTATION.md existe" "test -f DOCUMENTATION.md"
check "PATTERNS.md existe" "test -f PATTERNS.md"
check "QUICKSTART.md existe" "test -f QUICKSTART.md"
check "ARCHITECTURE.md existe" "test -f ARCHITECTURE.md"
check "ENTREGA.md existe" "test -f ENTREGA.md"

echo ""
echo "=========================================="
echo "  📊 RESUMEN DE VALIDACIÓN"
echo "=========================================="
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo -e "Total de pruebas: $TOTAL"
echo -e "${GREEN}Pasadas: $PASSED${NC}"
echo -e "${RED}Falladas: $FAILED${NC}"
echo -e "Porcentaje de éxito: $PERCENTAGE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ TODAS LAS VALIDACIONES PASARON${NC}"
    echo -e "${GREEN}  El proyecto está listo para entrega${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ⚠️  ALGUNAS VALIDACIONES FALLARON${NC}"
    echo -e "${RED}  Revisar los errores antes de entregar${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi

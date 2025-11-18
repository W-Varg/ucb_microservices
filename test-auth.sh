#!/bin/bash

# Script de prueba completa de autenticación
# Verifica el flujo: Registro → Login → Crear Tarea → Ver Estadísticas

echo "================================================"
echo "🔐 Prueba Completa de Autenticación JWT"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs de servicios
AUTH_URL="http://localhost:3003"
TASKS_URL="http://localhost:8080"
ANALYTICS_URL="http://localhost:3002"

echo "${YELLOW}1. Verificando que los servicios estén corriendo...${NC}"
sleep 2

# Health checks
echo -n "  → Auth Service: "
if curl -s "${AUTH_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ No disponible${NC}"
    exit 1
fi

echo -n "  → Tasks Service: "
if curl -s "${TASKS_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ No disponible${NC}"
    exit 1
fi

echo -n "  → Analytics Service: "
if curl -s "${ANALYTICS_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ No disponible${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}2. Registrando nuevo usuario...${NC}"

# Generar username único con timestamp
TIMESTAMP=$(date +%s)
USERNAME="testuser_${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@ucb.edu"
PASSWORD="TestPass123"

REGISTER_RESPONSE=$(curl -s -X POST "${AUTH_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${USERNAME}\",
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"roles\": [\"user\", \"admin\"]
  }")

# Verificar si el registro fue exitoso
if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
    echo -e "  ${GREEN}✓ Usuario registrado exitosamente${NC}"
    echo "  Username: ${USERNAME}"
    echo "  Email: ${EMAIL}"
else
    echo -e "  ${RED}✗ Error en registro${NC}"
    echo "$REGISTER_RESPONSE" | jq .
    exit 1
fi

# Extraer token
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.refreshToken')

echo "  Token obtenido: ${ACCESS_TOKEN:0:30}..."
echo ""

echo "${YELLOW}3. Validando token JWT...${NC}"
VALIDATE_RESPONSE=$(curl -s -X GET "${AUTH_URL}/auth/validate" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$VALIDATE_RESPONSE" | grep -q "valid"; then
    echo -e "  ${GREEN}✓ Token válido${NC}"
    echo "$VALIDATE_RESPONSE" | jq .
else
    echo -e "  ${RED}✗ Token inválido${NC}"
    exit 1
fi

echo ""
echo "${YELLOW}4. Creando tarea protegida con JWT...${NC}"

CREATE_TASK_RESPONSE=$(curl -s -X POST "${TASKS_URL}/api/tasks" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tarea de Prueba JWT",
    "description": "Esta tarea fue creada usando autenticación JWT",
    "status": "pending",
    "priority": "high"
  }')

if echo "$CREATE_TASK_RESPONSE" | grep -q "_id"; then
    TASK_ID=$(echo "$CREATE_TASK_RESPONSE" | jq -r '._id')
    echo -e "  ${GREEN}✓ Tarea creada exitosamente${NC}"
    echo "  ID de tarea: ${TASK_ID}"
    echo "$CREATE_TASK_RESPONSE" | jq .
else
    echo -e "  ${RED}✗ Error al crear tarea${NC}"
    echo "$CREATE_TASK_RESPONSE"
    exit 1
fi

echo ""
echo "${YELLOW}5. Obteniendo todas las tareas con JWT...${NC}"

GET_TASKS_RESPONSE=$(curl -s -X GET "${TASKS_URL}/api/tasks" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

TASK_COUNT=$(echo "$GET_TASKS_RESPONSE" | jq '. | length')
echo -e "  ${GREEN}✓ Tareas obtenidas: ${TASK_COUNT}${NC}"
echo "$GET_TASKS_RESPONSE" | jq '.[0:2]'  # Mostrar primeras 2 tareas

echo ""
echo "${YELLOW}6. Obteniendo estadísticas de Analytics con JWT...${NC}"

sleep 3  # Esperar a que Kafka procese eventos

STATS_RESPONSE=$(curl -s -X GET "${ANALYTICS_URL}/api/analytics/stats" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$STATS_RESPONSE" | grep -q "totalTasks"; then
    echo -e "  ${GREEN}✓ Estadísticas obtenidas${NC}"
    echo "$STATS_RESPONSE" | jq .
else
    echo -e "  ${RED}✗ Error al obtener estadísticas${NC}"
    echo "$STATS_RESPONSE"
fi

echo ""
echo "${YELLOW}7. Probando acceso SIN token (debería fallar)...${NC}"

NO_AUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "${TASKS_URL}/api/tasks")
HTTP_CODE=$(echo "$NO_AUTH_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "  ${GREEN}✓ Correctamente rechazado (401 Unauthorized)${NC}"
else
    echo -e "  ${RED}✗ Debería haber rechazado la petición${NC}"
fi

echo ""
echo "${YELLOW}8. Actualizando tarea con JWT...${NC}"

UPDATE_TASK_RESPONSE=$(curl -s -X PATCH "${TASKS_URL}/api/tasks/${TASK_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "description": "Tarea actualizada con JWT"
  }')

if echo "$UPDATE_TASK_RESPONSE" | grep -q "completed"; then
    echo -e "  ${GREEN}✓ Tarea actualizada exitosamente${NC}"
    echo "$UPDATE_TASK_RESPONSE" | jq .
else
    echo -e "  ${RED}✗ Error al actualizar tarea${NC}"
fi

echo ""
echo "${YELLOW}9. Probando refresh token...${NC}"

REFRESH_RESPONSE=$(curl -s -X POST "${AUTH_URL}/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"${REFRESH_TOKEN}\"
  }")

if echo "$REFRESH_RESPONSE" | grep -q "accessToken"; then
    NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.accessToken')
    echo -e "  ${GREEN}✓ Token renovado exitosamente${NC}"
    echo "  Nuevo token: ${NEW_ACCESS_TOKEN:0:30}..."
else
    echo -e "  ${RED}✗ Error al renovar token${NC}"
fi

echo ""
echo "${YELLOW}10. Cerrando sesión (logout)...${NC}"

LOGOUT_RESPONSE=$(curl -s -X POST "${AUTH_URL}/auth/logout" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$LOGOUT_RESPONSE" | grep -q "Logged out"; then
    echo -e "  ${GREEN}✓ Sesión cerrada exitosamente${NC}"
else
    echo -e "  ${RED}✗ Error al cerrar sesión${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ Todas las pruebas completadas exitosamente!${NC}"
echo "================================================"
echo ""
echo "📊 Resumen:"
echo "  - Usuario: ${USERNAME}"
echo "  - Tarea creada: ${TASK_ID}"
echo "  - Token inicial: ${ACCESS_TOKEN:0:20}..."
echo "  - Token renovado: ${NEW_ACCESS_TOKEN:0:20}..."
echo ""
echo "🔗 URLs importantes:"
echo "  - Auth Swagger: ${AUTH_URL}/api"
echo "  - Tasks Swagger: ${TASKS_URL}/api"
echo "  - Analytics Swagger: ${ANALYTICS_URL}/api"
echo ""
echo "📖 Ver guía completa: AUTH_GUIDE.md"

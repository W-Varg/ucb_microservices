#!/bin/bash

echo "=========================================="
echo "  Iniciando Microservicios - Reuniones"
echo "=========================================="
echo ""

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down

# Limpiar volúmenes (opcional)
read -p "¿Deseas limpiar los volúmenes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🧹 Limpiando volúmenes..."
    docker-compose down -v
fi

# Construir imágenes
echo ""
echo "🔨 Construyendo imágenes Docker..."
docker-compose build --no-cache

# Iniciar servicios
echo ""
echo "🚀 Iniciando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
echo ""
echo "📊 Estado de los servicios:"
docker-compose ps

echo ""
echo "=========================================="
echo "  ✅ Servicios iniciados correctamente"
echo "=========================================="
echo ""
echo "📚 Documentación Swagger:"
echo "   - Tasks Service: http://localhost:3001/api"
echo "   - Analytics Service: http://localhost:3002/api"
echo ""
echo "🔗 Endpoints disponibles:"
echo "   - Load Balancer: http://localhost"
echo "   - Tasks API: http://localhost/api/tasks"
echo "   - Analytics Stats: http://localhost:3002/api/analytics/stats"
echo ""
echo "💡 Para ver los logs: docker-compose logs -f"
echo "💡 Para detener: docker-compose down"
echo ""

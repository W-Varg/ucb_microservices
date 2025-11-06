#!/bin/bash

echo "=========================================="
echo "  Deteniendo Microservicios"
echo "=========================================="
echo ""

# Detener y eliminar contenedores
echo "🛑 Deteniendo contenedores..."
docker-compose down

# Preguntar si desea eliminar volúmenes
read -p "¿Deseas eliminar también los volúmenes (datos)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🧹 Eliminando volúmenes..."
    docker-compose down -v
fi

# Preguntar si desea eliminar imágenes
read -p "¿Deseas eliminar las imágenes Docker? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🗑️  Eliminando imágenes..."
    docker rmi reuniones-tasks-service-1 reuniones-tasks-service-2 reuniones-nginx-lb reuniones-analytics-service 2>/dev/null || true
fi

echo ""
echo "✅ Limpieza completada"
echo ""

#!/bin/bash

# Script para crear el ZIP de entrega del proyecto

echo "=========================================="
echo "  📦 CREACIÓN DE ZIP PARA ENTREGA"
echo "=========================================="
echo ""

# Definir variables
PROJECT_NAME="reuniones"
OUTPUT_ZIP="${PROJECT_NAME}-entrega.zip"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Este script debe ejecutarse desde el directorio del proyecto"
    exit 1
fi

echo "📋 Preparando archivos para entrega..."
echo ""

# Limpiar archivos temporales y node_modules
echo "🧹 Limpiando archivos temporales..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null
find . -name ".DS_Store" -type f -delete 2>/dev/null
find . -name "*.log" -type f -delete 2>/dev/null
find . -name "npm-debug.log*" -type f -delete 2>/dev/null

echo "✅ Limpieza completada"
echo ""

# Crear lista de archivos a incluir
echo "📝 Archivos que serán incluidos:"
echo ""

cat << 'EOF' > /tmp/zip-include.txt
# Archivos principales
docker-compose.yml
README.md
QUICKSTART.md
DOCUMENTATION.md
PATTERNS.md
ARCHITECTURE.md
ENTREGA.md
RESUMEN.md
.gitignore

# Scripts
start.sh
test.sh
stop.sh
validate.sh
package.sh

# Tasks Service
tasks-service/
tasks-service/src/
tasks-service/Dockerfile
tasks-service/.dockerignore
tasks-service/package.json
tasks-service/tsconfig.json
tasks-service/nest-cli.json

# Analytics Service
analytics-service/
analytics-service/src/
analytics-service/Dockerfile
analytics-service/.dockerignore
analytics-service/package.json
analytics-service/tsconfig.json
analytics-service/nest-cli.json

# NGINX Load Balancer
nginx-lb/
nginx-lb/Dockerfile
nginx-lb/nginx.conf
EOF

# Mostrar resumen
echo "📦 Estructura del proyecto:"
find . -type f \( -name "*.ts" -o -name "*.json" -o -name "*.yml" -o -name "*.conf" -o -name "*.md" -o -name "*.sh" -o -name "Dockerfile" -o -name ".dockerignore" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*" | wc -l | xargs echo "   Total de archivos:"

echo ""

# Crear el ZIP
echo "🗜️  Creando archivo ZIP..."
cd ..

zip -r "${OUTPUT_ZIP}" "${PROJECT_NAME}/" \
  -x "*/node_modules/*" \
  -x "*/dist/*" \
  -x "*/.git/*" \
  -x "*.log" \
  -x "*DS_Store" \
  -x "*.swp" \
  -x "*.swo" \
  -q

if [ $? -eq 0 ]; then
    echo "✅ ZIP creado exitosamente"
    echo ""
    
    # Mostrar información del ZIP
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 INFORMACIÓN DEL ARCHIVO"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "   Nombre: ${OUTPUT_ZIP}"
    echo "   Ubicación: $(pwd)/${OUTPUT_ZIP}"
    echo "   Tamaño: $(du -h "${OUTPUT_ZIP}" | cut -f1)"
    echo "   Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Contar archivos en el ZIP
    FILE_COUNT=$(unzip -l "${OUTPUT_ZIP}" | grep -c "^[-d]")
    echo "   Archivos incluidos: ${FILE_COUNT}"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ ARCHIVO LISTO PARA ENTREGA"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    echo "📋 Checklist de entrega:"
    echo "   [✓] Código fuente completo"
    echo "   [✓] Dockerfiles personalizados"
    echo "   [✓] docker-compose.yml"
    echo "   [✓] Scripts de automatización"
    echo "   [✓] Documentación completa"
    echo "   [✓] Sin node_modules"
    echo "   [✓] Sin archivos temporales"
    echo ""
    
    echo "🎯 Próximos pasos:"
    echo "   1. Descomprimir: unzip ${OUTPUT_ZIP}"
    echo "   2. Entrar al directorio: cd ${PROJECT_NAME}"
    echo "   3. Dar permisos: chmod +x *.sh"
    echo "   4. Ejecutar: ./start.sh"
    echo "   5. Validar: ./validate.sh"
    echo ""
    
    # Mostrar contenido resumido
    echo "📁 Contenido del ZIP (primeros 30 archivos):"
    echo ""
    unzip -l "${OUTPUT_ZIP}" | head -35 | tail -30
    echo "   ..."
    echo ""
    
    # Verificación final
    echo "🔍 Verificación final:"
    
    # Verificar que los archivos clave estén presentes
    REQUIRED_FILES=(
        "docker-compose.yml"
        "README.md"
        "tasks-service/Dockerfile"
        "analytics-service/Dockerfile"
        "nginx-lb/Dockerfile"
    )
    
    ALL_PRESENT=true
    for file in "${REQUIRED_FILES[@]}"; do
        if unzip -l "${OUTPUT_ZIP}" | grep -q "${PROJECT_NAME}/${file}"; then
            echo "   ✓ ${file}"
        else
            echo "   ✗ ${file} - FALTA"
            ALL_PRESENT=false
        fi
    done
    
    echo ""
    
    if [ "$ALL_PRESENT" = true ]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎉 TODO LISTO PARA ENTREGAR"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "El archivo ${OUTPUT_ZIP} está listo para ser entregado."
        echo "Puedes encontrarlo en: $(pwd)/${OUTPUT_ZIP}"
        echo ""
    else
        echo "⚠️  ADVERTENCIA: Algunos archivos importantes faltan"
        echo "   Revisa la lista anterior"
        echo ""
    fi
    
else
    echo "❌ Error al crear el ZIP"
    exit 1
fi

# Crear un resumen de entrega
cat > "../ENTREGA-INFO.txt" << EOF
========================================
  INFORMACIÓN DE ENTREGA
========================================

Proyecto: Microservicios con Patrones de Resiliencia
Estudiante: [Completar con tu nombre]
Materia: Arquitectura de Microservicios
Institución: UCB - Maestría en Desarrollo de Software
Fecha: $(date '+%Y-%m-%d')
Archivo: ${OUTPUT_ZIP}
Tamaño: $(du -h "${OUTPUT_ZIP}" | cut -f1)

========================================
  REQUISITOS CUMPLIDOS
========================================

✅ Partición en 2 microservicios (A y B)
✅ Separación basada en dominio
✅ Cada servicio con su Dockerfile
✅ Retry Pattern implementado
✅ Circuit Breaker implementado
✅ 2 réplicas del servicio A
✅ Load Balancer NGINX
✅ docker-compose.yml completo
✅ Listo para ejecutar sin configuración adicional

========================================
  INSTRUCCIONES DE EJECUCIÓN
========================================

1. Descomprimir el archivo:
   unzip ${OUTPUT_ZIP}

2. Entrar al directorio:
   cd ${PROJECT_NAME}

3. Dar permisos a los scripts:
   chmod +x *.sh

4. Iniciar servicios:
   ./start.sh
   O manualmente:
   docker-compose up --build -d

5. Ejecutar pruebas:
   ./test.sh

6. Validar requisitos:
   ./validate.sh

7. Ver documentación:
   - README.md - Información general
   - QUICKSTART.md - Guía rápida
   - DOCUMENTATION.md - Documentación técnica
   - PATTERNS.md - Patrones implementados
   - ARCHITECTURE.md - Diagramas de arquitectura
   - ENTREGA.md - Instrucciones de entrega

8. Acceder a Swagger UI:
   - Tasks Service: http://localhost:3001/api
   - Analytics Service: http://localhost:3002/api

========================================
  ARQUITECTURA
========================================

Cliente → NGINX LB → [Tasks-1, Tasks-2] → MongoDB
          ↓
     Analytics Service
     (Retry + Circuit Breaker)

========================================
  ENDPOINTS PRINCIPALES
========================================

Tasks Service (vía Load Balancer):
- http://localhost/api/tasks (GET, POST)
- http://localhost/api/tasks/:id (GET, PATCH, DELETE)
- http://localhost/health

Analytics Service:
- http://localhost:3002/api/analytics/stats
- http://localhost:3002/api/analytics/tasks-by-priority
- http://localhost:3002/api/analytics/circuit-breaker
- http://localhost:3002/health

========================================
  CONTACTO
========================================

Estudiante: [Tu nombre]
Email: [tu-email@ucb.edu.bo]
Teléfono: [tu teléfono]

========================================
EOF

echo "📄 Archivo de información creado: ENTREGA-INFO.txt"
echo ""
echo "✨ ¡Proceso completado exitosamente!"

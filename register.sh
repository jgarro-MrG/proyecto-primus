#!/bin/bash

# URL del endpoint
URL="http://localhost:3000/auth/register"

# Datos a enviar en formato JSON
JSON_DATA='{
  "full_name": "Jorge Garro",
  "email": "jorge@primus.com",
  "password": "password123"
}'

# Enviar la solicitud POST con curl
curl -X POST "$URL" \
-H "Content-Type: application/json" \
-d "$JSON_DATA"

# Imprime una nueva línea al final para una salida más limpia
echo
# Food Store — Backend

API REST construida con FastAPI + Python 3.12+.

## Setup

```bash
# 1. Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y completar SECRET_KEY (mínimo 32 caracteres)
```

## Levantar el servidor

```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints disponibles

| Endpoint | Descripción |
|---|---|
| `GET /api/v1/health` | Health check — verifica que el servidor está corriendo |
| `GET /docs` | Swagger UI |
| `GET /redoc` | ReDoc |
| `GET /openapi.json` | Schema OpenAPI 3.x |

## Probar el sistema

```bash
# Health check — debe responder 200
curl http://localhost:8000/api/v1/health

# Método no permitido — debe responder 405 en formato RFC 7807
curl -X POST http://localhost:8000/api/v1/health

# Ruta inexistente — debe responder 404 en formato RFC 7807
curl http://localhost:8000/api/v1/no-existe

# Preflight CORS desde el origen del frontend
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  http://localhost:8000/api/v1/health
```

Todos los errores siguen el formato [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807) (`application/problem+json`):

```json
{
  "type": "https://foodstore.app/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Not Found",
  "instance": "/api/v1/no-existe",
  "code": "NOT_FOUND"
}
```

## Variables de entorno

Ver `.env.example` para la lista completa con documentación. Las obligatorias son:

- `SECRET_KEY` — clave secreta mínimo 32 caracteres (`python -c "import secrets; print(secrets.token_hex(32))"`)
- `DATABASE_URL` — requerida a partir del change `infra-database` (opcional ahora)

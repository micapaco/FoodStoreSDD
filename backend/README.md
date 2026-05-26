# Food Store — Backend

API REST construida con FastAPI + Python 3.13 + PostgreSQL 16.

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Python 3.12 o superior

## Setup inicial

### 1. Entorno virtual y dependencias

```bash
# Desde la carpeta backend/
python -m venv .venv

# Activar el entorno (Windows)
.venv\Scripts\activate

# Activar el entorno (Mac/Linux)
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Variables de entorno

```bash
# Copiar el ejemplo
cp .env.example .env
```

Abrir `.env` y completar los valores. Los campos obligatorios son:

| Variable | Valor para desarrollo |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://foodstore_user:foodstore_pass@localhost:5432/foodstore_db` |
| `POSTGRES_USER` | `foodstore_user` |
| `POSTGRES_PASSWORD` | `foodstore_pass` |
| `POSTGRES_DB` | `foodstore_db` |
| `POSTGRES_PORT` | `5432` |
| `SECRET_KEY` | Generá uno con el comando de abajo |

Para generar el `SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Base de datos

```bash
# Levantar PostgreSQL con Docker
docker compose up -d

# Aplicar migraciones
python -m alembic upgrade head

# Cargar datos iniciales (roles, formas de pago, usuario admin)
python -m app.db.seed
```

> El seed crea los siguientes usuarios de desarrollo:
> | Usuario | Password | Rol |
> |---------|----------|-----|
> | `admin@foodstore.com` | `Admin1234!` | Admin |
> | `cocina@foodstore.com` | `Cocina1234!` | Cocinero |
>
> Cambiar estos passwords antes de ir a producción.

### 4. Levantar el servidor

```bash
python -m uvicorn app.main:app --reload
```

El servidor queda disponible en `http://127.0.0.1:8000`.

---

## Endpoints disponibles

| Endpoint | Descripción |
|---|---|
| `GET /api/v1/health` | Health check |
| `GET /docs` | Swagger UI — explorador interactivo |
| `GET /redoc` | ReDoc |
| `GET /openapi.json` | Schema OpenAPI 3.x |

## Verificar que todo funciona

```bash
# Health check — debe responder 200
curl http://localhost:8000/api/v1/health

# Ruta inexistente — debe responder 404 en formato RFC 7807
curl http://localhost:8000/api/v1/no-existe
```

Todos los errores siguen [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807) (`application/problem+json`):

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

---

## Comandos útiles

```bash
# Ver logs de PostgreSQL
docker compose logs db

# Detener Docker
docker compose down

# Detener Docker y borrar la base de datos (reset completo)
docker compose down -v

# Ver estado de migraciones
python -m alembic current

# Crear nueva migración (después de cambiar modelos)
python -m alembic revision --autogenerate -m "descripcion"
```

---

## Problemas conocidos

**`alembic` no se reconoce como comando en Windows**
Usar `python -m alembic` en lugar de `alembic` directamente.

**El contenedor de Docker arranca con variables vacías**
Si `docker compose up -d` muestra warnings de variables no seteadas, asegurate de haber completado el `.env` antes de correr el comando. Si ya corrió con variables vacías, hacer reset completo:
```bash
docker compose down -v
docker compose up -d
```

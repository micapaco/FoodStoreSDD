## ADDED Requirements

### Requirement: Servicio PostgreSQL local con Docker Compose

El proyecto SHALL incluir un `docker-compose.yml` en `backend/` que defina un servicio `db` basado en la imagen oficial `postgres:16-alpine`, con un volumen persistente nombrado para los datos, y que tome `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` desde variables de entorno (no hardcodeadas en el archivo).

#### Scenario: Levantar la base de datos por primera vez

- **WHEN** el desarrollador ejecuta `docker compose up -d` desde `backend/`
- **THEN** el servicio `db` arranca, crea el volumen si no existe, y PostgreSQL escucha en el puerto configurado (default 5432)

#### Scenario: Los datos persisten entre reinicios

- **WHEN** el desarrollador detiene el servicio con `docker compose down` (sin `-v`) y lo levanta de nuevo
- **THEN** los datos previamente insertados siguen presentes

#### Scenario: Limpiar completamente la base de datos

- **WHEN** el desarrollador ejecuta `docker compose down -v`
- **THEN** el volumen es eliminado y la próxima vez que levante el servicio la base de datos está vacía

### Requirement: Variables de entorno para el servicio Docker

El `docker-compose.yml` SHALL leer `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` y `POSTGRES_PORT` desde el archivo `.env` de la misma carpeta, usando la sintaxis `${VAR_NAME}` de Docker Compose. El `.env.example` SHALL incluir valores de ejemplo para todas estas variables.

#### Scenario: Configuración sin modificar el docker-compose.yml

- **GIVEN** un `backend/.env` con `POSTGRES_USER=foodstore_user`, `POSTGRES_PASSWORD=foodstore_pass`, `POSTGRES_DB=foodstore_db`
- **WHEN** se ejecuta `docker compose up -d`
- **THEN** PostgreSQL inicia con esas credenciales sin necesidad de editar el archivo `docker-compose.yml`

### Requirement: Healthcheck del servicio de base de datos

El servicio `db` en `docker-compose.yml` SHALL incluir un `healthcheck` que use `pg_isready` para verificar que PostgreSQL está listo para aceptar conexiones antes de que otros servicios dependientes arranquen.

#### Scenario: Servicio reporta saludable

- **WHEN** PostgreSQL terminó de inicializar y acepta conexiones
- **THEN** `docker compose ps` muestra el servicio `db` con estado `healthy`

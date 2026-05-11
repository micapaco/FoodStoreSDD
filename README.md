# 🍔 Food Store — Guía de Ejecución

Para levantar la aplicación correctamente, necesitás abrir **tres terminales separadas** y seguir estos pasos en orden.

---

## 1. 🗄️ Base de Datos (PostgreSQL en Docker)

Asegurate de tener Docker Desktop abierto en tu computadora. En la primera terminal, ingresá a la carpeta del backend y levantá la base de datos:

```powershell
cd backend

# Levanta la base de datos en segundo plano
docker compose up -d
```
*(Para apagarla cuando termines: `docker compose down`)*

---

## 2. ⚙️ Backend (FastAPI)

En una **nueva** terminal, ingresá a la carpeta del backend y activá el entorno virtual:

```powershell
cd backend

# 1. Crear el entorno virtual (SOLO LA PRIMERA VEZ o si borraste la carpeta .venv)
python -m venv .venv

# 2. Activar el entorno virtual (SIEMPRE ANTES DE CORRER EL PROYECTO)
.\.venv\Scripts\activate

# 3. Instalar dependencias (SOLO SI HAY CAMBIOS en requirements.txt)
pip install -r requirements.txt

# 4. Ejecutar las migraciones (SOLO LA PRIMERA VEZ o si hay cambios en la DB)
alembic upgrade head

# 5. Ejecutar el seed — Carga usuario admin y datos iniciales (SOLO LA PRIMERA VEZ)
python -m app.db.seed

# 6. Levantar el servidor
uvicorn app.main:app --reload --port 8000
```
*El backend estará corriendo en `http://localhost:8000` y podés ver la documentación en `http://localhost:8000/docs`.*

---

## 3. 🎨 Frontend (React + Vite)

En una **tercera** terminal, ingresá a la carpeta del frontend:

```powershell
cd frontend

# 1. Instalar dependencias (SOLO LA PRIMERA VEZ o si agregás nuevos paquetes)
npm install

# 2. Levantar la interfaz web
npm run dev
```
*El frontend estará corriendo en `http://localhost:5173`. Hacé Ctrl+Click en la terminal para abrirlo en tu navegador.*

---

## 📝 Credenciales por Defecto

Después de ejecutar el seed, podés iniciar sesión con:

- **Email:** `admin@foodstore.com`
- **Contraseña:** `Admin1234!`
- **Rol:** `ADMIN`

Estas credenciales se crean automáticamente cuando ejecutás `python -m app.db.seed`.

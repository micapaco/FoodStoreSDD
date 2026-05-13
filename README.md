# 🍔 Food Store — Guía de Ejecución

Para levantar la aplicación correctamente, necesitás abrir **tres terminales separadas** y seguir estos pasos en orden. Para probar webhooks de MercadoPago en local, usá una **cuarta terminal** con ngrok.

---
## 0. Antes denada, se debe hacer una copiar de los ".env.example" respectivos del backend y frontend, y pegarlos en su mismo directorio sin el final ".example"


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

## 3. 🌐 Webhooks MercadoPago con ngrok

https://www.mercadopago.com.ar/developers/panel/app

Este paso es necesario cuando querés que MercadoPago pueda llamar a tu backend local, por ejemplo para probar `POST /api/v1/pagos/webhook`.

### Instalar ngrok

1. Creá o ingresá a tu cuenta en ngrok.
2. Descargá ngrok para Windows desde la página oficial: <https://ngrok.com/download/windows>.
3. Instalalo con el método que prefieras. En Windows, ngrok recomienda Microsoft Store; también podés usar WinGet:

```powershell
winget install ngrok.ngrok
```

4. Copiá tu authtoken desde el dashboard de ngrok y configuralo una sola vez:

```powershell
ngrok config add-authtoken "<TU_NGROK_AUTHTOKEN>"
```

### Levantar el túnel

Con el backend ya corriendo en `http://localhost:8000`, abrí una terminal nueva y ejecutá:

```powershell
ngrok http 8000
```

ngrok va a mostrar una URL pública HTTPS parecida a:

```txt
https://abc123.ngrok-free.dev -> http://localhost:8000
```

La URL completa del webhook para MercadoPago es:

```txt
https://abc123.ngrok-free.dev/api/v1/pagos/webhook
```

Usá esa URL en:

- `backend/.env`: `MERCADOPAGO_NOTIFICATION_URL=https://abc123.ngrok-free.dev/api/v1/pagos/webhook`
- Panel de MercadoPago Developers, sección Webhooks.

También configurá en `backend/.env` la clave secreta de firma del panel:

```env
MERCADOPAGO_WEBHOOK_SECRET=valor_que_te_da_mercado_pago
```

Cada vez que reinicies ngrok gratis, la URL puede cambiar. Si cambia, actualizá `backend/.env`, reiniciá `uvicorn` y guardá la nueva URL en MercadoPago.

Para inspeccionar requests entrantes de MercadoPago, abrí:

```txt
http://127.0.0.1:4040
```

---

## 4. 🎨 Frontend (React + Vite)

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

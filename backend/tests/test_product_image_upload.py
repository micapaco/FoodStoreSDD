import tempfile
from pathlib import Path
from unittest import IsolatedAsyncioTestCase
from unittest.mock import patch

from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from app.core.exceptions import ValidationAppError
from app.db.models.identidad import Usuario
from app.main import app
from app.modules.productos.service import ProductoService


class FakeUploadFile:
    def __init__(self, content: bytes, content_type: str) -> None:
        self.content = content
        self.content_type = content_type

    async def read(self) -> bytes:
        return self.content


class ProductImageUploadTests(IsolatedAsyncioTestCase):
    async def test_guardar_imagen_producto_retorna_url(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("app.modules.productos.service.PRODUCT_IMAGE_DIR", Path(tmpdir)):
                url = await ProductoService.guardar_imagen_producto(
                    FakeUploadFile(b"fake-image", "image/png"),  # type: ignore[arg-type]
                    "http://localhost:8000/",
                )

        self.assertTrue(url.startswith("http://localhost:8000/static/uploads/productos/"))
        self.assertTrue(url.endswith(".png"))

    async def test_guardar_imagen_producto_rechaza_tipo_invalido(self) -> None:
        with self.assertRaises(ValidationAppError):
            await ProductoService.guardar_imagen_producto(
                FakeUploadFile(b"fake", "text/plain"),  # type: ignore[arg-type]
                "http://localhost:8000/",
            )

    async def test_guardar_imagen_producto_acepta_gif(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("app.modules.productos.service.PRODUCT_IMAGE_DIR", Path(tmpdir)):
                url = await ProductoService.guardar_imagen_producto(
                    FakeUploadFile(b"gif89a", "image/gif"),  # type: ignore[arg-type]
                    "http://localhost:8000/",
                )

        self.assertTrue(url.endswith(".gif"))

    async def test_guardar_imagen_producto_rechaza_tamano_invalido(self) -> None:
        with self.assertRaises(ValidationAppError):
            await ProductoService.guardar_imagen_producto(
                FakeUploadFile(b"x" * 1_000_001, "image/jpeg"),  # type: ignore[arg-type]
                "http://localhost:8000/",
            )


def _upload_auth_dependency() -> object:
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        if route.path == "/api/v1/productos/imagenes" and "POST" in route.methods:
            return route.dependant.dependencies[0].call
    raise AssertionError("No se encontro la dependency de upload de imagen.")


class ProductImageUploadRouterTests(IsolatedAsyncioTestCase):
    async def asyncTearDown(self) -> None:
        app.dependency_overrides.clear()

    async def test_upload_sin_auth_no_colisiona_con_producto_id(self) -> None:
        client = TestClient(app)

        response = client.post(
            "/api/v1/productos/imagenes",
            files={"file": ("pizza.jpg", b"fake-image", "image/jpeg")},
        )

        self.assertEqual(response.status_code, 401)
        self.assertNotIn("producto_id", response.text)

    async def test_upload_admin_retorna_imagen_url(self) -> None:
        async def fake_admin() -> Usuario:
            return Usuario(
                id=1,
                nombre="Admin",
                apellido="Test",
                email="admin@test.local",
                password_hash="x" * 60,
            )

        app.dependency_overrides[_upload_auth_dependency()] = fake_admin

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("app.modules.productos.service.PRODUCT_IMAGE_DIR", Path(tmpdir)):
                client = TestClient(app)
                response = client.post(
                    "/api/v1/productos/imagenes",
                    files={"file": ("pizza.jpg", b"fake-image", "image/jpeg")},
                )

        self.assertEqual(response.status_code, 201)
        self.assertIn("/static/uploads/productos/", response.json()["imagen_url"])

    async def test_upload_admin_rechaza_tipo_invalido(self) -> None:
        async def fake_admin() -> Usuario:
            return Usuario(
                id=1,
                nombre="Admin",
                apellido="Test",
                email="admin@test.local",
                password_hash="x" * 60,
            )

        app.dependency_overrides[_upload_auth_dependency()] = fake_admin
        client = TestClient(app)

        response = client.post(
            "/api/v1/productos/imagenes",
            files={"file": ("not-image.txt", b"fake", "text/plain")},
        )

        self.assertEqual(response.status_code, 422)

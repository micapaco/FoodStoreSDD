from datetime import datetime
from unittest import IsolatedAsyncioTestCase, TestCase

from app.core.exceptions import ConflictError
from app.core.repository import BaseRepository
from app.db.models.catalogo import Categoria, Ingrediente
from app.modules.categorias.schemas import CategoriaUpdate
from app.modules.categorias.service import CategoriaService
from app.modules.ingredientes.schemas import IngredienteUpdate
from app.modules.ingredientes.service import IngredienteService


class FakeSession:
    def __init__(self) -> None:
        self.added: list[object] = []

    def add(self, entity: object) -> None:
        self.added.append(entity)

    async def flush(self) -> None:
        return None


class FakeCategoriaRepository:
    def __init__(self) -> None:
        self.categoria = Categoria(id=1, nombre="Bebidas", parent_id=None)
        self.active_duplicate: Categoria | None = None
        self.created: Categoria | None = None

    async def get_by_id(self, _categoria_id: int) -> Categoria:
        return self.categoria

    async def get_by_nombre(self, _nombre: str) -> Categoria | None:
        return None

    async def get_active_by_nombre_normalized(self, _nombre: str) -> Categoria | None:
        return self.active_duplicate

    async def validate_parent_exists(self, _parent_id: int) -> bool:
        return True

    async def create(self, categoria: Categoria) -> Categoria:
        categoria.id = 2
        self.created = categoria
        return categoria

    async def update(self, categoria: Categoria) -> Categoria:
        self.categoria = categoria
        return categoria


class FakeIngredienteRepository:
    def __init__(self) -> None:
        self.ingrediente = Ingrediente(id=1, nombre="Queso", es_alergeno=False)

    async def get_by_id(self, _ingrediente_id: int) -> Ingrediente:
        return self.ingrediente

    async def get_by_nombre(self, _nombre: str) -> Ingrediente | None:
        return None

    async def update(self, ingrediente: Ingrediente) -> Ingrediente:
        self.ingrediente = ingrediente
        return ingrediente


class FakeCategoriaUow:
    def __init__(self) -> None:
        self.categorias = FakeCategoriaRepository()


class FakeIngredienteUow:
    def __init__(self) -> None:
        self.ingredientes = FakeIngredienteRepository()


class CatalogTimestampModelTests(TestCase):
    def test_categoria_defaults_are_utc_naive(self) -> None:
        categoria = Categoria(nombre="Bebidas")

        self.assertIsInstance(categoria.created_at, datetime)
        self.assertIsNone(categoria.created_at.tzinfo)
        self.assertIsNone(categoria.updated_at.tzinfo)

    def test_ingrediente_defaults_are_utc_naive(self) -> None:
        ingrediente = Ingrediente(nombre="Queso", es_alergeno=False)

        self.assertIsInstance(ingrediente.created_at, datetime)
        self.assertIsNone(ingrediente.created_at.tzinfo)
        self.assertIsNone(ingrediente.updated_at.tzinfo)


class CatalogTimestampServiceTests(IsolatedAsyncioTestCase):
    async def test_categoria_update_uses_utc_naive_timestamp(self) -> None:
        uow = FakeCategoriaUow()
        data = CategoriaUpdate(nombre="Bebidas Frias")

        result = await CategoriaService.update(uow, 1, data)  # type: ignore[arg-type]

        self.assertEqual("Bebidas Frias", result.nombre)
        self.assertIsNone(result.updated_at.tzinfo)

    async def test_ingrediente_update_uses_utc_naive_timestamp(self) -> None:
        uow = FakeIngredienteUow()
        data = IngredienteUpdate(nombre="Queso Azul")

        result = await IngredienteService.update(uow, 1, data)  # type: ignore[arg-type]

        self.assertEqual("Queso Azul", result.nombre)
        self.assertIsNone(result.updated_at.tzinfo)

    async def test_soft_delete_uses_utc_naive_timestamp(self) -> None:
        session = FakeSession()
        repository = BaseRepository(session, Categoria)  # type: ignore[arg-type]
        categoria = Categoria(id=1, nombre="Bebidas")

        await repository.soft_delete(categoria)

        self.assertIsNotNone(categoria.deleted_at)
        self.assertIsNone(categoria.deleted_at.tzinfo)

    async def test_categoria_create_ignores_soft_deleted_name_conflicts(self) -> None:
        from app.modules.categorias.schemas import CategoriaCreate

        uow = FakeCategoriaUow()
        data = CategoriaCreate(nombre="  Bebidas  ")

        result = await CategoriaService.create(uow, data)  # type: ignore[arg-type]

        self.assertEqual("Bebidas", result.nombre)
        self.assertEqual("Bebidas", uow.categorias.created.nombre)

    async def test_categoria_create_rejects_active_duplicate_name(self) -> None:
        from app.modules.categorias.schemas import CategoriaCreate

        uow = FakeCategoriaUow()
        uow.categorias.active_duplicate = Categoria(id=9, nombre="bebidas")
        data = CategoriaCreate(nombre=" Bebidas ")

        with self.assertRaises(ConflictError):
            await CategoriaService.create(uow, data)  # type: ignore[arg-type]

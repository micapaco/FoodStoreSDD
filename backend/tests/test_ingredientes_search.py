from datetime import datetime
from unittest import IsolatedAsyncioTestCase

from app.db.models.catalogo import Ingrediente
from app.modules.ingredientes.service import IngredienteService


class FakeIngredienteRepository:
    def __init__(self) -> None:
        self.items = [
            Ingrediente(
                id=1,
                nombre="Queso",
                es_alergeno=True,
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 1),
            ),
            Ingrediente(
                id=2,
                nombre="Tomate",
                es_alergeno=False,
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 1),
            ),
            Ingrediente(
                id=3,
                nombre="Queso azul",
                es_alergeno=True,
                created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 1),
            ),
        ]
        self.filtered_calls: list[dict[str, object]] = []

    def _filtered(self, alergeno: bool | None, q: str | None) -> list[Ingrediente]:
        result = self.items
        if alergeno is not None:
            result = [item for item in result if item.es_alergeno is alergeno]

        search = q.strip().lower() if q else ""
        if search:
            result = [item for item in result if search in item.nombre.lower()]

        return result

    async def list_filtered(
        self,
        skip: int = 0,
        limit: int = 100,
        alergeno: bool | None = None,
        q: str | None = None,
    ) -> list[Ingrediente]:
        self.filtered_calls.append(
            {"skip": skip, "limit": limit, "alergeno": alergeno, "q": q}
        )
        return self._filtered(alergeno, q)[skip : skip + limit]

    async def count_filtered(
        self,
        alergeno: bool | None = None,
        q: str | None = None,
    ) -> int:
        return len(self._filtered(alergeno, q))

    async def list_alergenos(self, skip: int = 0, limit: int = 100) -> list[Ingrediente]:
        return self._filtered(True, None)[skip : skip + limit]

    async def count_alergenos(self) -> int:
        return len(self._filtered(True, None))

    async def list_no_alergenos(self, skip: int = 0, limit: int = 100) -> list[Ingrediente]:
        return self._filtered(False, None)[skip : skip + limit]

    async def count_no_alergenos(self) -> int:
        return len(self._filtered(False, None))

    async def list_active(self, skip: int = 0, limit: int = 100) -> list[Ingrediente]:
        return self.items[skip : skip + limit]

    async def count_active(self) -> int:
        return len(self.items)


class FakeUnitOfWork:
    def __init__(self) -> None:
        self.ingredientes = FakeIngredienteRepository()


class IngredienteSearchServiceTests(IsolatedAsyncioTestCase):
    async def test_list_all_searches_by_name_case_insensitive(self) -> None:
        uow = FakeUnitOfWork()

        result = await IngredienteService.list_all(uow, page=1, size=20, q="queso")  # type: ignore[arg-type]

        self.assertEqual(2, result.total)
        self.assertEqual(["Queso", "Queso azul"], [item.nombre for item in result.items])
        self.assertEqual(1, result.pages)

    async def test_list_all_combines_search_allergen_filter_and_pagination(self) -> None:
        uow = FakeUnitOfWork()

        result = await IngredienteService.list_all(
            uow,  # type: ignore[arg-type]
            page=2,
            size=1,
            alergeno=True,
            q=" queso ",
        )

        self.assertEqual(2, result.total)
        self.assertEqual(2, result.pages)
        self.assertEqual(2, result.page)
        self.assertEqual(["Queso azul"], [item.nombre for item in result.items])
        self.assertEqual(
            {"skip": 1, "limit": 1, "alergeno": True, "q": "queso"},
            uow.ingredientes.filtered_calls[0],
        )

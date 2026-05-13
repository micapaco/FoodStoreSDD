from unittest import TestCase

from pydantic import ValidationError

from app.modules.usuarios.schemas import CambiarRolesRequest


class CambiarRolesRequestTests(TestCase):
    def test_accepts_exactly_one_valid_role(self) -> None:
        data = CambiarRolesRequest.model_validate({"roles": ["STOCK"]})

        self.assertEqual(["STOCK"], data.roles)

    def test_rejects_empty_roles(self) -> None:
        with self.assertRaises(ValidationError):
            CambiarRolesRequest.model_validate({"roles": []})

    def test_rejects_multiple_roles(self) -> None:
        with self.assertRaises(ValidationError):
            CambiarRolesRequest.model_validate({"roles": ["ADMIN", "CLIENT"]})

    def test_rejects_unknown_role(self) -> None:
        with self.assertRaises(ValidationError):
            CambiarRolesRequest.model_validate({"roles": ["SUPERUSER"]})

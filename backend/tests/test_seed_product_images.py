import tempfile
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch

from app.db import seed


class SeedProductImageTests(TestCase):
    def test_prepare_seed_image_copia_asset_y_retorna_url(self) -> None:
        with tempfile.TemporaryDirectory() as source_dir:
            with tempfile.TemporaryDirectory() as target_dir:
                source = Path(source_dir) / "pizza.jpg"
                source.write_bytes(b"pizza-image")

                with patch.object(seed, "SEED_IMAGE_SOURCE_DIR", Path(source_dir)):
                    with patch.object(seed, "SEED_IMAGE_TARGET_DIR", Path(target_dir)):
                        result = seed._prepare_seed_image("pizza")

                self.assertEqual(result, "/static/uploads/productos/seed/pizza.jpg")
                self.assertEqual((Path(target_dir) / "pizza.jpg").read_bytes(), b"pizza-image")

    def test_prepare_seed_image_faltante_retorna_none(self) -> None:
        with tempfile.TemporaryDirectory() as source_dir:
            with tempfile.TemporaryDirectory() as target_dir:
                with patch.object(seed, "SEED_IMAGE_SOURCE_DIR", Path(source_dir)):
                    with patch.object(seed, "SEED_IMAGE_TARGET_DIR", Path(target_dir)):
                        result = seed._prepare_seed_image("agua")

                self.assertIsNone(result)

    def test_can_replace_seed_image_no_pisa_imagen_manual(self) -> None:
        self.assertTrue(seed._can_replace_seed_image(None))
        self.assertTrue(seed._can_replace_seed_image("/static/uploads/productos/seed/pizza.jpg"))
        self.assertFalse(seed._can_replace_seed_image("https://cdn.example.com/manual.jpg"))

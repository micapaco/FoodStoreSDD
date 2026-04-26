"""
Configuración centralizada del backend.

Usa pydantic-settings para cargar variables desde .env con validación tipada.
Se expone como singleton vía get_settings() decorado con @lru_cache.

Uso como dependencia FastAPI:
    from fastapi import Depends
    from app.core.config import get_settings, Settings

    def mi_handler(settings: Settings = Depends(get_settings)):
        ...

Override en tests:
    app.dependency_overrides[get_settings] = lambda: Settings(SECRET_KEY="test-key-32-chars-long-enough-ok")
"""

import json
from functools import lru_cache
from typing import Literal

from pydantic import computed_field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Aplicación ──────────────────────────────────────────────────────────
    APP_NAME: str = "Food Store API"
    APP_VERSION: str = "0.1.0"
    ENV: Literal["dev", "test", "prod"] = "dev"
    DEBUG: bool = True

    # ── Base de datos ────────────────────────────────────────────────────────
    # Opcional en este change. Obligatorio en infra-database.
    DATABASE_URL: str | None = None

    # ── Seguridad ────────────────────────────────────────────────────────────
    SECRET_KEY: str  # obligatorio, sin default

    # ── JWT ──────────────────────────────────────────────────────────────────
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Se declara como str para evitar que pydantic-settings intente JSON-decodificar
    # el valor del .env antes de que corra cualquier validador (comportamiento de
    # pydantic-settings v2 para campos list[str]). El computed_field cors_origins
    # expone el valor ya parseado como list[str] para el resto del código.
    CORS_ORIGINS: str = "http://localhost:5173"

    # ── MercadoPago ──────────────────────────────────────────────────────────
    MERCADOPAGO_ACCESS_TOKEN: str | None = None
    MERCADOPAGO_PUBLIC_KEY: str | None = None

    # ── Rate limiting ────────────────────────────────────────────────────────
    # String parseable por slowapi. No se usa como default_limits en este change.
    RATE_LIMIT_DEFAULT: str = "60/minute"
    # URI de storage para replicas (Redis). None = memoria en dev/test.
    RATE_LIMIT_STORAGE_URI: str | None = None

    # ── Payload ──────────────────────────────────────────────────────────────
    MAX_BODY_SIZE_BYTES: int = 1_048_576  # 1 MB

    # ── Validadores ─────────────────────────────────────────────────────────

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_min_length(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY debe tener al menos 32 caracteres. "
                f"Largo actual: {len(v)}."
            )
        return v

    @field_validator("CORS_ORIGINS")
    @classmethod
    def cors_origins_no_vacio(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError(
                "CORS_ORIGINS no puede estar vacío. "
                "Definí al menos un origen (ej: http://localhost:5173)."
            )
        return v

    @model_validator(mode="after")
    def cors_no_wildcard_con_credentials(self) -> "Settings":
        """Evita la combinación insegura allow_origins=['*'] con credentials."""
        if "*" in self.cors_origins:
            raise ValueError(
                "CORS_ORIGINS no puede contener '*' (wildcard). "
                "Con allow_credentials=True el navegador rechaza la respuesta "
                "y además es inseguro. Especificá los orígenes explícitamente."
            )
        return self

    @model_validator(mode="after")
    def debug_segun_entorno(self) -> "Settings":
        """En prod, DEBUG debe ser False para no exponer trazas."""
        if self.ENV == "prod" and self.DEBUG:
            pass
        return self

    # ── Computed fields ──────────────────────────────────────────────────────

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins(self) -> list[str]:
        """Parsea CORS_ORIGINS (str) a list[str]. Acepta JSON array o CSV."""
        v = self.CORS_ORIGINS.strip()
        if v.startswith("["):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed]
            except json.JSONDecodeError:
                pass
        return [origin.strip() for origin in v.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Singleton de Settings. Cacheado para evitar re-parseo en cada request.

    Override en tests:
        app.dependency_overrides[get_settings] = lambda: Settings(...)
        get_settings.cache_clear()  # limpiar cache entre tests
    """
    return Settings()

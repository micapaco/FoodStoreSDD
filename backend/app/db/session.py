from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

_settings = get_settings()

engine = create_async_engine(
    _settings.DATABASE_URL,
    echo=_settings.DEBUG,
    future=True,
)

AsyncSessionLocal: sessionmaker = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_session():
    """Dependencia FastAPI que provee una AsyncSession por request.

    El commit es responsabilidad del UnitOfWork, no de esta dependencia.
    La sesión se cierra automáticamente al finalizar el generador.
    """
    async with AsyncSessionLocal() as session:
        yield session

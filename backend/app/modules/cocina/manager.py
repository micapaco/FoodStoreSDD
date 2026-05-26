import asyncio
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Gestor singleton de WebSockets activos del KDS de cocina."""

    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.add(ws)

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(ws)

    async def broadcast(self, message: dict[str, Any]) -> None:
        """Envía el mensaje a todos los WebSockets activos.

        Las conexiones cerradas se eliminan silenciosamente — best-effort v1.
        """
        async with self._lock:
            dead: set[WebSocket] = set()
            for ws in self._connections:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.add(ws)
            self._connections -= dead
            if dead:
                logger.debug("Removed %d dead WebSocket connection(s)", len(dead))


# Singleton importable desde cualquier módulo del paquete
manager = ConnectionManager()


async def emit_cocina_event(event_type: str, pedido_id: int, pedido_read: dict | None = None) -> None:
    """Emite un evento al KDS. Llamar DESPUÉS del commit del UoW."""
    payload: dict = {"type": event_type, "pedido_id": pedido_id}
    if pedido_read is not None:
        payload["pedido"] = pedido_read
    await manager.broadcast(payload)

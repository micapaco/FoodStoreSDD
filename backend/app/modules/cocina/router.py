from typing import Annotated

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select, text

from app.core.deps import require_role
from app.core.exceptions import UnauthorizedError
from app.core.security import verify_token
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.db.models.ventas import DetallePedido, HistorialEstadoPedido, Pedido
from app.modules.cocina.manager import manager
from app.modules.cocina.schemas import ItemCocinaRead, PedidoCocinaRead

router = APIRouter(prefix="/cocina", tags=["Cocina"])


async def build_pedido_cocina_read(uow: UnitOfWork, pedido: Pedido) -> PedidoCocinaRead:
    """Construye PedidoCocinaRead para un pedido dado — reutilizable desde otros routers."""
    detalles_result = await uow.session.execute(
        select(DetallePedido).where(DetallePedido.pedido_id == pedido.id)
    )
    detalles: list[DetallePedido] = list(detalles_result.scalars().all())

    historial_result = await uow.session.execute(
        select(HistorialEstadoPedido)
        .where(HistorialEstadoPedido.pedido_id == pedido.id)
        .where(HistorialEstadoPedido.estado_hasta == "CONFIRMADO")
    )
    historial_rows = list(historial_result.scalars().all())
    timestamp_entrada = historial_rows[0].created_at if historial_rows else None

    return PedidoCocinaRead(
        id=pedido.id,
        estado_codigo=pedido.estado_codigo,
        notas=pedido.notas,
        created_at=pedido.created_at,
        timestamp_entrada_cocina=timestamp_entrada,
        items=[
            ItemCocinaRead(
                nombre_snapshot=d.nombre_snapshot,
                cantidad=d.cantidad,
                personalizacion=d.personalizacion or None,
            )
            for d in detalles
        ],
    )

COCINA_ESTADOS = ("CONFIRMADO", "EN_PREP")
_WS_ALLOWED_ROLES = {"COCINA", "PEDIDOS", "ADMIN"}


@router.websocket("/ws")
async def cocina_ws(
    websocket: WebSocket,
    token: str | None = Query(default=None),
) -> None:
    """WebSocket KDS — autentica JWT por query param, código 4001 si inválido."""
    if not token:
        await websocket.close(code=4001)
        return

    try:
        payload = verify_token(token)
        user_id_str = payload.get("sub")
        user_id = int(user_id_str)  # type: ignore[arg-type]
    except Exception:
        await websocket.close(code=4001)
        return

    # Verificar que el usuario tiene rol permitido
    try:
        async with UnitOfWork() as uow:
            result = await uow.usuarios.get_with_roles(user_id)
        if result is None:
            await websocket.close(code=4001)
            return
        _, roles = result
        if not any(r in _WS_ALLOWED_ROLES for r in roles):
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    await manager.connect(websocket)
    try:
        while True:
            # Mantiene la conexión abierta; el KDS no envía mensajes al servidor
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(websocket)


@router.get(
    "/pedidos",
    response_model=list[PedidoCocinaRead],
    status_code=status.HTTP_200_OK,
)
async def listar_pedidos_activos(
    _current_user: Annotated[Usuario, Depends(require_role(["COCINA", "PEDIDOS", "ADMIN"]))],
) -> list[PedidoCocinaRead]:
    """Retorna pedidos en CONFIRMADO o EN_PREP ordenados por timestamp_entrada_cocina ascendente."""
    async with UnitOfWork() as uow:
        # Pedidos activos de cocina
        pedidos_result = await uow.session.execute(
            select(Pedido)
            .where(Pedido.estado_codigo.in_(list(COCINA_ESTADOS)))
            .where(Pedido.deleted_at.is_(None))
            .order_by(Pedido.created_at.asc())
        )
        pedidos: list[Pedido] = list(pedidos_result.scalars().all())

        if not pedidos:
            return []

        pedido_ids = [p.id for p in pedidos]

        # Ítems de cada pedido
        detalles_result = await uow.session.execute(
            select(DetallePedido).where(DetallePedido.pedido_id.in_(pedido_ids))
        )
        detalles: list[DetallePedido] = list(detalles_result.scalars().all())
        detalles_by_pedido: dict[int, list[DetallePedido]] = {}
        for d in detalles:
            detalles_by_pedido.setdefault(d.pedido_id, []).append(d)

        # timestamp_entrada_cocina = created_at del historial donde estado_hasta = 'CONFIRMADO'
        historial_result = await uow.session.execute(
            select(HistorialEstadoPedido)
            .where(HistorialEstadoPedido.pedido_id.in_(pedido_ids))
            .where(HistorialEstadoPedido.estado_hasta == "CONFIRMADO")
        )
        historial_rows: list[HistorialEstadoPedido] = list(historial_result.scalars().all())
        entrada_by_pedido: dict[int, object] = {
            h.pedido_id: h.created_at for h in historial_rows
        }

        result: list[PedidoCocinaRead] = []
        for pedido in pedidos:
            items = [
                ItemCocinaRead(
                    nombre_snapshot=d.nombre_snapshot,
                    cantidad=d.cantidad,
                    personalizacion=d.personalizacion or None,
                )
                for d in detalles_by_pedido.get(pedido.id, [])
            ]
            result.append(
                PedidoCocinaRead(
                    id=pedido.id,
                    estado_codigo=pedido.estado_codigo,
                    notas=pedido.notas,
                    created_at=pedido.created_at,
                    timestamp_entrada_cocina=entrada_by_pedido.get(pedido.id),  # type: ignore[arg-type]
                    items=items,
                )
            )

        return result

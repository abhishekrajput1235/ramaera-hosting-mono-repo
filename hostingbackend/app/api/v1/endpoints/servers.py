from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.server_service import ServerService
from app.schemas.server import Server, ServerCreate, ServerUpdate, ServerAction
from app.schemas.users import User

router = APIRouter()

# ------------------------------------
# PUBLIC: Get all servers
# ------------------------------------
@router.get("/")
async def get_servers(
    db: AsyncSession = Depends(get_db),
    server_service: ServerService = Depends()
):
    """Public: Get all servers"""
    return await server_service.get_all_servers(db)


# ------------------------------------
# PUBLIC: Get server by ID
# ------------------------------------
@router.get("/{server_id}")
async def get_server(
    server_id: int,
    db: AsyncSession = Depends(get_db),
    server_service: ServerService = Depends()
):
    server = await server_service.get_server_by_id(db, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    return server


# ------------------------------------
# PRIVATE: Create server
# ------------------------------------
@router.post("/", response_model=Server)
async def create_server(
    server_data: ServerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    server_service: ServerService = Depends()
):
    """Create server (requires login)"""
    return await server_service.create_user_server(db, current_user.id, server_data)


# ------------------------------------
# PRIVATE: Update server
# ------------------------------------
@router.put("/{server_id}", response_model=Server)
async def update_server(
    server_id: int,
    server_update: ServerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    server_service: ServerService = Depends()
):
    """Update server (requires login)"""
    if current_user.role in ["admin", "super_admin"]:
        server = await server_service.update_server(db, server_id, server_update)
    else:
        server = await server_service.update_user_server(db, current_user.id, server_id, server_update)

    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    return server


# ------------------------------------
# PRIVATE: Server actions
# ------------------------------------
@router.post("/{server_id}/action")
async def server_action(
    server_id: int,
    action: ServerAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    server_service: ServerService = Depends()
):
    """Perform server actions (requires login)"""
    if current_user.role in ["admin", "super_admin"]:
        success = await server_service.perform_server_action(db, server_id, action.action)
    else:
        success = await server_service.perform_user_server_action(db, current_user.id, server_id, action.action)

    if not success:
        raise HTTPException(status_code=404, detail="Server not found or invalid action")

    return {"message": f"Server {action.action} action performed successfully"}


# ------------------------------------
# PRIVATE: Delete server
# ------------------------------------
@router.delete("/{server_id}")
async def delete_server(
    server_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    server_service: ServerService = Depends()
):
    """Delete server (requires login)"""
    if current_user.role in ["admin", "super_admin"]:
        success = await server_service.delete_server(db, server_id)
    else:
        success = await server_service.delete_user_server(db, current_user.id, server_id)

    if not success:
        raise HTTPException(status_code=404, detail="Server not found")

    return {"message": "Server deleted successfully"}


# ------------------------------------
# PRIVATE: Server status
# ------------------------------------
@router.get("/{server_id}/status")
async def get_server_status(
    server_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    server_service: ServerService = Depends()
):
    """Get server status (requires login)"""
    if current_user.role in ["admin", "super_admin"]:
        server = await server_service.get_server_by_id(db, server_id)
    else:
        server = await server_service.get_user_server(db, current_user.id, server_id)

    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    return {
        "server_id": server.id,
        "server_name": server.server_name,
        "status": server.server_status,
        "ip_address": server.ip_address,
        "uptime": "99.9%",
        "cpu_usage": "15%",
        "memory_usage": "45%",
        "storage_usage": "60%",
    }

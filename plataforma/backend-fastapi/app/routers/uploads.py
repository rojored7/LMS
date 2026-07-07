import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

_UPLOADS_DIR = os.path.realpath(os.environ.get("UPLOADS_DIR", "/app/uploads"))


@router.get("/{path:path}")
async def serve_upload(
    path: str,
    _user: User = Depends(get_current_user),
) -> FileResponse:
    requested = os.path.realpath(os.path.join(_UPLOADS_DIR, path))
    if not requested.startswith(_UPLOADS_DIR + os.sep):
        raise HTTPException(status_code=403, detail="Acceso denegado")
    if not os.path.isfile(requested):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(requested)

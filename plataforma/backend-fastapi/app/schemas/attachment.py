from datetime import datetime

from app.schemas.common import CamelModel


class AttachmentResponse(CamelModel):
    id: str
    lesson_id: str
    original_filename: str
    file_size: int
    mime_type: str
    description: str | None = None
    uploaded_by: str | None = None
    created_at: datetime
    download_url: str

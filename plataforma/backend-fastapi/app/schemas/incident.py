from pydantic import BaseModel


class IncidentReport(BaseModel):
    incident_id: str
    severity: str
    timestamp: str
    error_source: str = "unknown"
    error: dict
    user: dict | None = None
    request: dict | None = None
    client_info: dict | None = None
    breadcrumbs: list[dict] = []
    backend_logs: list[str] = []
    glitchtip_url: str | None = None
    status: str = "open"

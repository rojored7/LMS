from pydantic import BaseModel


class GlitchTipWebhook(BaseModel):
    id: str | None = None
    project: str | None = None
    project_slug: str | None = None
    level: str | None = None
    title: str | None = None
    message: str | None = None
    culprit: str | None = None
    url: str | None = None
    event: dict | None = None


class IncidentReport(BaseModel):
    incident_id: str
    severity: str
    timestamp: str
    error: dict
    user: dict | None = None
    request: dict | None = None
    breadcrumbs: list[dict] = []
    backend_logs: list[str] = []
    glitchtip_url: str | None = None
    status: str = "open"

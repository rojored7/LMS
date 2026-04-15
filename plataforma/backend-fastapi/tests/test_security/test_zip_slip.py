import io
import zipfile

import pytest
from fastapi import UploadFile

from app.routers.course_management import _extract_zip_to_temp, MAX_ZIP_SIZE


def _make_upload(content: bytes, filename: str = "test.zip") -> UploadFile:
    return UploadFile(filename=filename, file=io.BytesIO(content))


def _build_zip(files: dict[str, bytes]) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for name, data in files.items():
            zf.writestr(name, data)
    return buf.getvalue()


async def test_zip_with_path_traversal_rejected() -> None:
    """A ZIP containing a path traversal entry must be rejected."""
    malicious = _build_zip({"../../etc/passwd": b"root:x:0:0"})
    upload = _make_upload(malicious)
    with pytest.raises(ValueError, match="insegura"):
        await _extract_zip_to_temp(upload)


async def test_zip_normal_accepted() -> None:
    """A normal ZIP with safe paths should be extracted without error."""
    normal = _build_zip({"readme.txt": b"hello", "config.json": b'{"title":"Test"}'})
    upload = _make_upload(normal)
    result = await _extract_zip_to_temp(upload)
    assert result.exists()
    import shutil
    # cleanup
    parent = result
    while parent.parent != parent and "course_import_" not in parent.name:
        parent = parent.parent
    shutil.rmtree(parent, ignore_errors=True)


async def test_zip_too_large_rejected() -> None:
    """A ZIP file exceeding MAX_ZIP_SIZE must be rejected."""
    large_content = b"x" * (MAX_ZIP_SIZE + 1)
    upload = _make_upload(large_content)
    with pytest.raises(ValueError, match="tamano maximo"):
        await _extract_zip_to_temp(upload)


async def test_zip_empty_rejected() -> None:
    """An empty upload must be rejected."""
    upload = _make_upload(b"")
    with pytest.raises(ValueError, match="vacio"):
        await _extract_zip_to_temp(upload)


async def test_zip_invalid_format_rejected() -> None:
    """A file that is not a valid ZIP must be rejected."""
    upload = _make_upload(b"this is not a zip file at all")
    with pytest.raises(ValueError, match="no es un ZIP"):
        await _extract_zip_to_temp(upload)

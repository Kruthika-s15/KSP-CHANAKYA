from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from datetime import datetime

from app.db.session import get_db
from app.models import CaseEvidence, CaseMaster

router = APIRouter(prefix="/evidence", tags=["evidence"])

ALLOWED_TYPES = {
    "image/jpeg": "image", "image/png": "image", "image/gif": "image",
    "image/bmp": "image", "image/webp": "image",
    "application/pdf": "pdf",
    "audio/mpeg": "audio", "audio/wav": "audio", "audio/ogg": "audio",
    "audio/webm": "audio", "audio/mp4": "audio",
    "video/mp4": "video", "video/webm": "video", "video/ogg": "video",
    "video/quicktime": "video",
}


@router.post("/{case_id}")
async def upload_evidence(
    case_id: int,
    files: List[UploadFile] = File(...),
    description: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Upload one or more evidence files for a case."""
    case = await db.scalar(select(CaseMaster.CaseMasterID).filter(CaseMaster.CaseMasterID == case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    uploaded = []
    for f in files:
        mime = f.content_type or "application/octet-stream"
        file_type = ALLOWED_TYPES.get(mime, "other")
        data = await f.read()
        if len(data) > 50 * 1024 * 1024:  # 50 MB limit
            raise HTTPException(status_code=413, detail=f"File {f.filename} exceeds 50MB limit")

        evidence = CaseEvidence(
            CaseMasterID=case_id,
            FileName=f.filename or "unnamed",
            FileType=file_type,
            FileData=data,
            MimeType=mime,
            Description=description,
            UploadedAt=datetime.utcnow(),
        )
        db.add(evidence)
        await db.flush()
        uploaded.append({
            "EvidenceID": evidence.EvidenceID,
            "FileName": evidence.FileName,
            "FileType": evidence.FileType,
            "MimeType": evidence.MimeType,
        })

    await db.commit()
    return {"uploaded": uploaded, "count": len(uploaded)}


@router.get("/{case_id}")
async def list_evidence(case_id: int, db: AsyncSession = Depends(get_db)):
    """List all evidence metadata for a case (no file bytes)."""
    result = await db.execute(
        select(
            CaseEvidence.EvidenceID, CaseEvidence.CaseMasterID,
            CaseEvidence.FileName, CaseEvidence.FileType,
            CaseEvidence.MimeType, CaseEvidence.Description,
            CaseEvidence.UploadedAt,
        ).filter(CaseEvidence.CaseMasterID == case_id)
        .order_by(CaseEvidence.UploadedAt.desc())
    )
    rows = result.all()
    return [
        {
            "EvidenceID": r.EvidenceID,
            "CaseMasterID": r.CaseMasterID,
            "FileName": r.FileName,
            "FileType": r.FileType,
            "MimeType": r.MimeType,
            "Description": r.Description,
            "UploadedAt": r.UploadedAt.isoformat() if r.UploadedAt else None,
        }
        for r in rows
    ]


@router.get("/file/{evidence_id}")
async def download_evidence(evidence_id: int, db: AsyncSession = Depends(get_db)):
    """Download/stream a single evidence file."""
    evidence = await db.scalar(
        select(CaseEvidence).filter(CaseEvidence.EvidenceID == evidence_id)
    )
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    return Response(
        content=evidence.FileData,
        media_type=evidence.MimeType,
        headers={
            "Content-Disposition": f'inline; filename="{evidence.FileName}"',
        },
    )


@router.delete("/{evidence_id}")
async def delete_evidence(evidence_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an evidence record."""
    evidence = await db.scalar(
        select(CaseEvidence).filter(CaseEvidence.EvidenceID == evidence_id)
    )
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    await db.delete(evidence)
    await db.commit()
    return {"status": "deleted", "EvidenceID": evidence_id}

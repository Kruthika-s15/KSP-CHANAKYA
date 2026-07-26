import os
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models import BiometricRecord, Accused, CaseMaster, District, Unit, CrimeHead, CaseStatusMaster
from app.schemas.biometric import (
    BiometricRecordCreate, BiometricRecordResponse, BiometricSearchResponse, BiometricMatchHit,
)
from app.services.fingerprint_service import compare_fingerprints
from app.catalyst.auth import get_current_investigator

router = APIRouter(prefix="/biometrics", tags=["biometrics"])


def _match_query():
    """Base join from a biometric record out to its case + lookup labels."""
    return (
        select(
            BiometricRecord,
            Accused.AccusedName,
            CaseMaster.CaseMasterID,
            CaseMaster.CrimeNo,
            CaseMaster.CaseNo,
            District.DistrictName,
            Unit.UnitName.label("PoliceStationName"),
            CrimeHead.CrimeGroupName.label("CrimeHead"),
            CaseStatusMaster.CaseStatusName.label("CaseStatus"),
        )
        .join(Accused, BiometricRecord.AccusedMasterID == Accused.AccusedMasterID)
        .join(CaseMaster, Accused.CaseMasterID == CaseMaster.CaseMasterID)
        .outerjoin(Unit, CaseMaster.PoliceStationID == Unit.UnitID)
        .outerjoin(District, Unit.DistrictID == District.DistrictID)
        .outerjoin(CrimeHead, CaseMaster.CrimeMajorHeadID == CrimeHead.CrimeHeadID)
        .outerjoin(CaseStatusMaster, CaseMaster.CaseStatusID == CaseStatusMaster.CaseStatusID)
    )


def _row_to_hit(row) -> BiometricMatchHit:
    rec = row[0]
    return BiometricMatchHit(
        BiometricID=rec.BiometricID,
        BiometricType=rec.BiometricType,
        BiometricRefID=rec.BiometricRefID,
        AccusedMasterID=rec.AccusedMasterID,
        AccusedName=row.AccusedName,
        CaseMasterID=row.CaseMasterID,
        CrimeNo=row.CrimeNo,
        CaseNo=row.CaseNo,
        DistrictName=row.DistrictName,
        PoliceStationName=row.PoliceStationName,
        CrimeHead=row.CrimeHead,
        CaseStatus=row.CaseStatus,
    )


@router.post("", response_model=BiometricRecordResponse)
async def register_biometric(
    payload: BiometricRecordCreate,
    db: AsyncSession = Depends(get_db),
    investigator: dict = Depends(get_current_investigator)
):
    """Register a biometric capture (fingerprint/iris/photo) for an accused person."""
    accused = await db.scalar(select(Accused).filter(Accused.AccusedMasterID == payload.AccusedMasterID))
    if not accused:
        raise HTTPException(status_code=404, detail="Accused person not found")

    record = BiometricRecord(**payload.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return BiometricRecordResponse.model_validate(record)


@router.get("/search", response_model=BiometricSearchResponse)
async def search_by_biometric(
    biometric_ref_id: str = Query(..., description="External biometric reference ID (fingerprint/iris/photo match key)"),
    db: AsyncSession = Depends(get_db),
    investigator: dict = Depends(get_current_investigator)
):
    """
    The core biometric-match feature: given a biometric reference ID, find
    every accused record across every case file that shares that same
    biometric signature.
    """
    query = _match_query().filter(BiometricRecord.BiometricRefID == biometric_ref_id)
    result = await db.execute(query)
    rows = result.all()

    matches = [_row_to_hit(row) for row in rows]
    distinct_cases = len({m.CaseMasterID for m in matches})

    return BiometricSearchResponse(
        query_ref_id=biometric_ref_id,
        total_matches=len(matches),
        is_repeat_offender=distinct_cases > 1,
        distinct_cases=distinct_cases,
        matches=matches,
    )


@router.get("/accused/{accused_id}", response_model=list[BiometricRecordResponse])
async def get_accused_biometrics(
    accused_id: int,
    db: AsyncSession = Depends(get_db),
    investigator: dict = Depends(get_current_investigator)
):
    """List every biometric record captured for a given accused person."""
    accused = await db.scalar(select(Accused).filter(Accused.AccusedMasterID == accused_id))
    if not accused:
        raise HTTPException(status_code=404, detail="Accused person not found")

    records = (
        await db.execute(select(BiometricRecord).filter(BiometricRecord.AccusedMasterID == accused_id))
    ).scalars().all()
    return [BiometricRecordResponse.model_validate(r) for r in records]


@router.get("/accused/{accused_id}/linked-cases", response_model=BiometricSearchResponse)
async def get_linked_cases_for_accused(
    accused_id: int,
    db: AsyncSession = Depends(get_db),
    investigator: dict = Depends(get_current_investigator)
):
    """
    Pulls every biometric ref tied to this accused, then finds every other accused sharing any of those refs.
    """
    ref_ids = (
        await db.execute(
            select(BiometricRecord.BiometricRefID).filter(BiometricRecord.AccusedMasterID == accused_id)
        )
    ).scalars().all()

    if not ref_ids:
        raise HTTPException(status_code=404, detail="No biometric records found for this accused person")

    query = _match_query().filter(BiometricRecord.BiometricRefID.in_(ref_ids))
    result = await db.execute(query)
    rows = result.all()

    matches = [_row_to_hit(row) for row in rows]
    distinct_cases = len({m.CaseMasterID for m in matches})

    return BiometricSearchResponse(
        query_ref_id=",".join(sorted(set(ref_ids))),
        total_matches=len(matches),
        is_repeat_offender=distinct_cases > 1,
        distinct_cases=distinct_cases,
        matches=matches,
    )


@router.post("/verify")
async def verify_fingerprint(
    sample: UploadFile = File(..., description="Sample fingerprint image"),
    target: UploadFile = File(..., description="Target fingerprint image"),
    investigator: dict = Depends(get_current_investigator)
):
    """
    Compare two uploaded fingerprint images using ORB feature matching.
    Returns match score (0-100), status (MATCH / NO MATCH), and a
    base64-encoded side-by-side visualization overlay.
    """
    sample_bytes = await sample.read()
    target_bytes = await target.read()

    if not sample_bytes or not target_bytes:
        raise HTTPException(status_code=400, detail="Both sample and target images are required.")

    try:
        result = compare_fingerprints(sample_bytes, target_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return result

@router.post("/identify")
async def identify_fingerprint(
    sample: UploadFile = File(..., description="Sample fingerprint image to identify"),
    db: AsyncSession = Depends(get_db),
    investigator: dict = Depends(get_current_investigator)
):
    """
    Identifies a fingerprint by comparing it against all stored dataset images in the database.
    Finds the highest match score > 12% and returns the matched suspect's profile.
    """
    sample_bytes = await sample.read()
    if not sample_bytes:
        raise HTTPException(status_code=400, detail="Sample image is required.")

    # 1. Fetch all biometric records of type FINGERPRINT
    query = select(BiometricRecord).filter(BiometricRecord.BiometricType == "FINGERPRINT")
    result = await db.execute(query)
    records = result.scalars().all()

    max_score = 0.0
    best_match_id = None
    best_visualization = None

    for record in records:
        if not record.Remarks or not os.path.exists(record.Remarks):
            continue
        
        try:
            with open(record.Remarks, "rb") as f:
                target_bytes = f.read()
                
            match_result = compare_fingerprints(sample_bytes, target_bytes)
            score = match_result["match_score"]
            if score > max_score:
                max_score = score
                best_match_id = record.BiometricID
                best_visualization = match_result["visualization"]
        except Exception:
            # Skip on error reading/matching
            pass

    if max_score > 12.0 and best_match_id is not None:
        # Fetch full profile
        hit_query = _match_query().filter(BiometricRecord.BiometricID == best_match_id)
        hit_result = await db.execute(hit_query)
        row = hit_result.first()
        if row:
            hit = _row_to_hit(row)
            return {
                "status": "MATCH",
                "match_score": max_score,
                "visualization": best_visualization,
                "suspect": hit.model_dump()
            }

    return {
        "status": "NO MATCH",
        "match_score": max_score,
        "message": "No matching fingerprint found above threshold."
    }

# ---------------------------------------------------------------------------
# Face Match - Zia face analytics (live) or graceful degradation
# ---------------------------------------------------------------------------

@router.post("/face-match")
async def face_match_endpoint(
    probe: UploadFile = File(..., description="Suspect/probe face image"),
    db: AsyncSession = Depends(get_db),
    investigator: dict = Depends(get_current_investigator),
):
    """
    Facial recognition: scan all PHOTO biometric records in DB and return best match.
    Routes through Catalyst Zia Face Analytics when credentials are set.
    Returns 503 with explanation when Zia is not configured.
    """
    from app.catalyst.zia import face_match as zia_face_match
    from app.catalyst.base import NotConfiguredError

    probe_bytes = await probe.read()
    if not probe_bytes:
        raise HTTPException(status_code=400, detail="Probe image is required.")

    photo_result = await db.execute(
        select(BiometricRecord).filter(BiometricRecord.BiometricType == "PHOTO")
    )
    photo_records = photo_result.scalars().all()

    if not photo_records:
        return {
            "mode": "database_scan",
            "status": "NO MATCH",
            "confidence": 0,
            "message": "No PHOTO biometric records in the database to compare against.",
        }

    best_score = 0.0
    best_id = None

    for rec in photo_records:
        if not rec.Remarks or not os.path.exists(rec.Remarks):
            continue
        try:
            with open(rec.Remarks, "rb") as f:
                stored_bytes = f.read()
            score = zia_face_match(
                probe_bytes, stored_bytes,
                probe.filename or "probe.png",
                rec.BiometricRefID + ".png",
            )
            if score > best_score:
                best_score = score
                best_id = rec.BiometricID
        except NotConfiguredError as exc:
            raise HTTPException(status_code=503, detail=str(exc))
        except Exception:
            continue

    confidence = round(best_score * 100, 1)
    if confidence >= 60 and best_id is not None:
        hit_query = _match_query().filter(BiometricRecord.BiometricID == best_id)
        hit_result = await db.execute(hit_query)
        row = hit_result.first()
        if row:
            hit = _row_to_hit(row)
            return {
                "mode": "database_scan",
                "status": "MATCH",
                "confidence": confidence,
                "threshold": 60,
                "suspect": hit.model_dump(),
                "message": f"Suspect identified with {confidence}% facial similarity.",
            }

    return {
        "mode": "database_scan",
        "status": "NO MATCH",
        "confidence": confidence,
        "message": "No facial match found above threshold in the biometric database.",
    }


@router.post("/face-match/pairwise")
async def face_match_pairwise(
    probe: UploadFile = File(..., description="Probe face image"),
    candidate: UploadFile = File(..., description="Candidate face image"),
    investigator: dict = Depends(get_current_investigator),
):
    """Pairwise face comparison between two uploaded images."""
    from app.catalyst.zia import face_match as zia_face_match
    from app.catalyst.base import NotConfiguredError

    probe_bytes = await probe.read()
    candidate_bytes = await candidate.read()
    if not probe_bytes or not candidate_bytes:
        raise HTTPException(status_code=400, detail="Both probe and candidate images are required.")

    try:
        raw_score = zia_face_match(
            probe_bytes, candidate_bytes,
            probe.filename or "probe.png",
            candidate.filename or "candidate.png",
        )
        confidence = round(raw_score * 100, 1)
        return {
            "mode": "pairwise",
            "status": "MATCH" if confidence >= 70 else "NO MATCH",
            "confidence": confidence,
            "threshold": 70,
            "message": f"Zia face similarity: {confidence}%",
        }
    except NotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


# ---------------------------------------------------------------------------
# OCR - extract text from uploaded FIR / document images
# ---------------------------------------------------------------------------

@router.post("/ocr")
async def ocr_document(
    document: UploadFile = File(..., description="Scanned FIR / document image"),
    investigator: dict = Depends(get_current_investigator),
):
    """
    Extract text from a scanned FIR / handwritten note image via Catalyst Zia OCR.
    Returns extracted text for display in the AI Assistant chat.
    """
    from app.catalyst.zia import ocr_extract_text
    from app.catalyst.base import NotConfiguredError

    doc_bytes = await document.read()
    if not doc_bytes:
        raise HTTPException(status_code=400, detail="Document image is required.")

    try:
        text = ocr_extract_text(doc_bytes, document.filename or "document.png")
        return {"status": "ok", "filename": document.filename, "extracted_text": text}
    except NotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

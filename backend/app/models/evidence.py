from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, LargeBinary
from datetime import datetime, timezone
from app.db.base import Base


class CaseEvidence(Base):
    __tablename__ = "caseevidence"

    EvidenceID = Column(Integer, primary_key=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"), nullable=False)
    FileName = Column(String, nullable=False)
    FileType = Column(String, nullable=False)  # image, pdf, audio, video
    FileData = Column(LargeBinary, nullable=False)
    MimeType = Column(String, nullable=False)
    Description = Column(Text, nullable=True)
    UploadedAt = Column(DateTime, default=lambda: datetime.now(timezone.utc))

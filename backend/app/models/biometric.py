from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey
from app.db.base import Base


class BiometricRecord(Base):
    """
    A biometric capture (fingerprint / iris / photo) tied to an accused
    person in a specific case. The same real person can show up as a
    *different* AccusedMasterID in a *different* case (aliases, spelling
    variants, etc). BiometricRefID is the stable identifier from the
    external biometric system (AFIS-style) that lets us say "these two
    accused records, in two different cases, are actually the same person."
    """
    __tablename__ = "biometricrecord"

    BiometricID = Column(Integer, primary_key=True)
    AccusedMasterID = Column(Integer, ForeignKey("accused.AccusedMasterID"), nullable=False)
    BiometricType = Column(String, nullable=False)   # FINGERPRINT | IRIS | PHOTO
    BiometricRefID = Column(String, nullable=False, index=True)  # external match key
    CapturedDate = Column(Date)
    CapturedByID = Column(Integer, ForeignKey("employee.EmployeeID"))
    Remarks = Column(Text)


class CaseStatusHistory(Base):
    """Append-only log of case status changes over time."""
    __tablename__ = "casestatushistory"

    CaseStatusHistoryID = Column(Integer, primary_key=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"), nullable=False)
    CaseStatusID = Column(Integer, ForeignKey("casestatusmaster.CaseStatusID"), nullable=False)
    ChangedDate = Column(DateTime, nullable=False)
    ChangedByID = Column(Integer, ForeignKey("employee.EmployeeID"))
    Remarks = Column(Text)

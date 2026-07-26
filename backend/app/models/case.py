from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, CHAR, Text, ForeignKey, ForeignKeyConstraint
from app.db.base import Base

class CaseMaster(Base):
    __tablename__ = "casemaster"
    CaseMasterID = Column(Integer, primary_key=True)
    CrimeNo = Column(String)
    CaseNo = Column(String)
    CrimeRegisteredDate = Column(Date)
    IncidentFromDate = Column(DateTime)
    IncidentToDate = Column(DateTime)
    InfoReceivedPSDate = Column(DateTime)
    latitude = Column(Numeric)
    longitude = Column(Numeric)
    BriefFacts = Column(Text)
    
    PolicePersonID = Column(Integer, ForeignKey("employee.EmployeeID"))
    PoliceStationID = Column(Integer, ForeignKey("unit.UnitID"))
    CaseCategoryID = Column(Integer, ForeignKey("casecategory.CaseCategoryID"))
    GravityOffenceID = Column(Integer, ForeignKey("gravityoffence.GravityOffenceID"))
    CrimeMajorHeadID = Column(Integer, ForeignKey("crimehead.CrimeHeadID"))
    CrimeMinorHeadID = Column(Integer, ForeignKey("crimesubhead.CrimeSubHeadID"))
    CaseStatusID = Column(Integer, ForeignKey("casestatusmaster.CaseStatusID"))
    CourtID = Column(Integer, ForeignKey("court.CourtID"))

class ActSectionAssociation(Base):
    __tablename__ = "actsectionassociation"
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"), primary_key=True)
    # TODO: PDF mentions ActID INT, but Act table PK is VARCHAR. Using String to preserve FK relationship.
    ActID = Column(String, primary_key=True)
    SectionID = Column(String, primary_key=True)
    ActOrderID = Column(Integer)
    SectionOrderID = Column(Integer)
    
    __table_args__ = (
        ForeignKeyConstraint(
            ['ActID', 'SectionID'],
            ['section.ActCode', 'section.SectionCode']
        ),
    )

class ChargesheetDetails(Base):
    __tablename__ = "chargesheetdetails"
    CSID = Column(Integer, primary_key=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"))
    csdate = Column(DateTime)
    cstype = Column(CHAR(1))
    PolicePersonID = Column(Integer, ForeignKey("employee.EmployeeID"))

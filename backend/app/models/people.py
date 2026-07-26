from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date
from app.db.base import Base

class ComplainantDetails(Base):
    __tablename__ = "complainantdetails"
    ComplainantID = Column(Integer, primary_key=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"))
    ComplainantName = Column(String)
    AgeYear = Column(Integer)
    OccupationID = Column(Integer, ForeignKey("occupationmaster.OccupationID"))
    ReligionID = Column(Integer, ForeignKey("religionmaster.ReligionID"))
    CasteID = Column(Integer, ForeignKey("castemaster.caste_master_id"))
    GenderID = Column(Integer)

class Victim(Base):
    __tablename__ = "victim"
    VictimMasterID = Column(Integer, primary_key=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"))
    VictimName = Column(String)
    AgeYear = Column(Integer)
    GenderID = Column(Integer)
    VictimPolice = Column(String)

class Accused(Base):
    __tablename__ = "accused"
    AccusedMasterID = Column(Integer, primary_key=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"))
    AccusedName = Column(String)
    AgeYear = Column(Integer)
    GenderID = Column(Integer)
    PersonID = Column(String)

class ArrestSurrender(Base):
    __tablename__ = "arrestsurrender"
    ArrestSurrenderID = Column(Integer, primary_key=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"))
    ArrestSurrenderTypeID = Column(Integer)
    ArrestSurrenderDate = Column(Date)
    ArrestSurrenderStateId = Column(Integer, ForeignKey("state.StateID"))
    ArrestSurrenderDistrictId = Column(Integer, ForeignKey("district.DistrictID"))
    PoliceStationID = Column(Integer, ForeignKey("unit.UnitID"))
    IOID = Column(Integer, ForeignKey("employee.EmployeeID"))
    CourtID = Column(Integer, ForeignKey("court.CourtID"))
    AccusedMasterID = Column(Integer, ForeignKey("accused.AccusedMasterID"))
    IsAccused = Column(Boolean)
    IsComplainantAccused = Column(Boolean)

# TODO: PDF mentions inv_arrestsurrenderaccused as an M:N table. Implemented minimal required FKs based on PDF relationship matrix.
class InvArrestSurrenderAccused(Base):
    __tablename__ = "inv_arrestsurrenderaccused"
    ArrestSurrenderID = Column(Integer, ForeignKey("arrestsurrender.ArrestSurrenderID"), primary_key=True)
    AccusedMasterID = Column(Integer, ForeignKey("accused.AccusedMasterID"), primary_key=True)

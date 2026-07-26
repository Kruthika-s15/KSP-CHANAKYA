from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.db.base import Base

class State(Base):
    __tablename__ = "state"
    StateID = Column(Integer, primary_key=True)
    StateName = Column(String)
    NationalityID = Column(Integer)
    Active = Column(Boolean)

class District(Base):
    __tablename__ = "district"
    DistrictID = Column(Integer, primary_key=True)
    DistrictName = Column(String)
    StateID = Column(Integer, ForeignKey("state.StateID"))
    Active = Column(Boolean)

class Court(Base):
    __tablename__ = "court"
    CourtID = Column(Integer, primary_key=True)
    CourtName = Column(String)
    DistrictID = Column(Integer, ForeignKey("district.DistrictID"))
    StateID = Column(Integer, ForeignKey("state.StateID"))
    Active = Column(Boolean)

class UnitType(Base):
    __tablename__ = "unittype"
    UnitTypeID = Column(Integer, primary_key=True)
    UnitTypeName = Column(String)
    CityDistState = Column(String)
    Hierarchy = Column(Integer)
    Active = Column(Boolean)

class Unit(Base):
    __tablename__ = "unit"
    UnitID = Column(Integer, primary_key=True)
    UnitName = Column(String)
    TypeID = Column(Integer, ForeignKey("unittype.UnitTypeID"))
    ParentUnit = Column(Integer)
    NationalityID = Column(Integer)
    StateID = Column(Integer, ForeignKey("state.StateID"))
    DistrictID = Column(Integer, ForeignKey("district.DistrictID"))
    Active = Column(Boolean)

class CasteMaster(Base):
    __tablename__ = "castemaster"
    caste_master_id = Column(Integer, primary_key=True)
    caste_master_name = Column(String)

class ReligionMaster(Base):
    __tablename__ = "religionmaster"
    ReligionID = Column(Integer, primary_key=True)
    ReligionName = Column(String)

class OccupationMaster(Base):
    __tablename__ = "occupationmaster"
    OccupationID = Column(Integer, primary_key=True)
    OccupationName = Column(String)

class CaseStatusMaster(Base):
    __tablename__ = "casestatusmaster"
    CaseStatusID = Column(Integer, primary_key=True)
    CaseStatusName = Column(String)

class CaseCategory(Base):
    __tablename__ = "casecategory"
    CaseCategoryID = Column(Integer, primary_key=True)
    LookupValue = Column(String)

class GravityOffence(Base):
    __tablename__ = "gravityoffence"
    GravityOffenceID = Column(Integer, primary_key=True)
    LookupValue = Column(String)

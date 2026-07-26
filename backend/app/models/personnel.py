from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date
from app.db.base import Base

class Rank(Base):
    __tablename__ = "rank"
    RankID = Column(Integer, primary_key=True)
    RankName = Column(String)
    Hierarchy = Column(Integer)
    Active = Column(Boolean)

class Designation(Base):
    __tablename__ = "designation"
    DesignationID = Column(Integer, primary_key=True)
    DesignationName = Column(String)
    Active = Column(Boolean)
    SortOrder = Column(Integer)

class Employee(Base):
    __tablename__ = "employee"
    EmployeeID = Column(Integer, primary_key=True)
    DistrictID = Column(Integer, ForeignKey("district.DistrictID"))
    UnitID = Column(Integer, ForeignKey("unit.UnitID"))
    RankID = Column(Integer, ForeignKey("rank.RankID"))
    DesignationID = Column(Integer, ForeignKey("designation.DesignationID"))
    KGID = Column(String)
    FirstName = Column(String)
    EmployeeDOB = Column(Date)
    GenderID = Column(Integer)
    BloodGroupID = Column(Integer)
    PhysicallyChallenged = Column(Boolean)
    AppointmentDate = Column(Date)

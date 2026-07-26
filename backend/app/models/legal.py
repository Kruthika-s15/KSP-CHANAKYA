from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, ForeignKeyConstraint
from app.db.base import Base

class Act(Base):
    __tablename__ = "act"
    ActCode = Column(String, primary_key=True)
    ActDescription = Column(String)
    ShortName = Column(String)
    Active = Column(Boolean)

class Section(Base):
    __tablename__ = "section"
    SectionCode = Column(String, primary_key=True)
    ActCode = Column(String, ForeignKey("act.ActCode"), primary_key=True)
    SectionDescription = Column(String)
    Active = Column(Boolean)

class CrimeHead(Base):
    __tablename__ = "crimehead"
    CrimeHeadID = Column(Integer, primary_key=True)
    CrimeGroupName = Column(String)
    Active = Column(Boolean)

class CrimeSubHead(Base):
    __tablename__ = "crimesubhead"
    CrimeSubHeadID = Column(Integer, primary_key=True)
    CrimeHeadID = Column(Integer, ForeignKey("crimehead.CrimeHeadID"))
    CrimeHeadName = Column(String)
    SeqID = Column(Integer)

class CrimeHeadActSection(Base):
    __tablename__ = "crimeheadactsection"
    CrimeHeadID = Column(Integer, ForeignKey("crimehead.CrimeHeadID"), primary_key=True)
    ActCode = Column(String, primary_key=True)
    SectionCode = Column(String, primary_key=True)
    
    __table_args__ = (
        ForeignKeyConstraint(
            ['ActCode', 'SectionCode'],
            ['section.ActCode', 'section.SectionCode']
        ),
    )

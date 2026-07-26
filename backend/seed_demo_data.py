import asyncio
from datetime import date, datetime, timedelta
import random
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

from app.core.config import settings
from app.models import (
    State, District, Court, UnitType, Unit, CasteMaster, ReligionMaster, OccupationMaster,
    CaseStatusMaster, CaseCategory, GravityOffence, Rank, Designation, Employee,
    Act, Section, CrimeHead, CrimeSubHead, CrimeHeadActSection, CaseMaster,
    ActSectionAssociation, ComplainantDetails, Victim, Accused,
    ChargesheetDetails, ArrestSurrender, InvArrestSurrenderAccused,
    BiometricRecord, CaseStatusHistory,
)

# Use synchronous string if asyncpg has issues, but we are using asyncpg.
engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def check_if_seeded(session: AsyncSession) -> bool:
    result = await session.execute(select(State).limit(1))
    return result.first() is not None

async def seed_data():
    async with AsyncSessionLocal() as session:
        if await check_if_seeded(session):
            print("Database is already seeded! Skipping to avoid duplicates.")
            return

        print("Starting data seed...")

        # 1. Master Data
        state_ka = State(StateName="DEMO_Karnataka", NationalityID=1, Active=True)
        session.add(state_ka)
        await session.flush()

        dist_blr = District(DistrictName="DEMO_Bengaluru City", StateID=state_ka.StateID, Active=True)
        dist_mys = District(DistrictName="DEMO_Mysuru City", StateID=state_ka.StateID, Active=True)
        session.add_all([dist_blr, dist_mys])
        await session.flush()

        court_1 = Court(CourtName="DEMO_High Court", DistrictID=dist_blr.DistrictID, StateID=state_ka.StateID, Active=True)
        session.add(court_1)
        await session.flush()

        ut_ps = UnitType(UnitTypeName="Police Station", CityDistState="City", Hierarchy=1, Active=True)
        session.add(ut_ps)
        await session.flush()

        unit_1 = Unit(UnitName="DEMO_Indiranagar PS", TypeID=ut_ps.UnitTypeID, StateID=state_ka.StateID, DistrictID=dist_blr.DistrictID, Active=True, ParentUnit=0, NationalityID=1)
        unit_2 = Unit(UnitName="DEMO_Koramangala PS", TypeID=ut_ps.UnitTypeID, StateID=state_ka.StateID, DistrictID=dist_blr.DistrictID, Active=True, ParentUnit=0, NationalityID=1)
        session.add_all([unit_1, unit_2])
        await session.flush()

        # Lookups
        caste = CasteMaster(caste_master_name="DEMO_General")
        religion = ReligionMaster(ReligionName="DEMO_None")
        occ = OccupationMaster(OccupationName="DEMO_Private Employee")
        status_inv = CaseStatusMaster(CaseStatusName="DEMO_Under Investigation")
        status_clo = CaseStatusMaster(CaseStatusName="DEMO_Closed")
        cat_fir = CaseCategory(LookupValue="DEMO_FIR")
        grav_hei = GravityOffence(LookupValue="DEMO_Heinous")
        grav_non = GravityOffence(LookupValue="DEMO_Non-Heinous")
        
        session.add_all([caste, religion, occ, status_inv, status_clo, cat_fir, grav_hei, grav_non])
        await session.flush()

        # Personnel
        rank_si = Rank(RankName="Sub-Inspector", Hierarchy=5, Active=True)
        desig_io = Designation(DesignationName="Investigating Officer", Active=True, SortOrder=1)
        session.add_all([rank_si, desig_io])
        await session.flush()

        emp = Employee(
            DistrictID=dist_blr.DistrictID, UnitID=unit_1.UnitID, RankID=rank_si.RankID,
            DesignationID=desig_io.DesignationID, KGID="DEMO123", FirstName="DEMO_Officer_Ramesh",
            EmployeeDOB=date(1980, 1, 1), GenderID=1, BloodGroupID=1, PhysicallyChallenged=False,
            AppointmentDate=date(2010, 1, 1)
        )
        session.add(emp)
        await session.flush()

        # Legal
        act_ipc = Act(ActCode="IPC_DEMO", ActDescription="Indian Penal Code", ShortName="IPC", Active=True)
        session.add(act_ipc)
        await session.flush()

        sec_379 = Section(SectionCode="379", ActCode=act_ipc.ActCode, SectionDescription="Theft", Active=True)
        sec_302 = Section(SectionCode="302", ActCode=act_ipc.ActCode, SectionDescription="Murder", Active=True)
        session.add_all([sec_379, sec_302])
        await session.flush()

        ch_theft = CrimeHead(CrimeGroupName="DEMO_Theft", Active=True)
        ch_body = CrimeHead(CrimeGroupName="DEMO_Crimes Against Body", Active=True)
        session.add_all([ch_theft, ch_body])
        await session.flush()

        csh_veh = CrimeSubHead(CrimeHeadID=ch_theft.CrimeHeadID, CrimeHeadName="Vehicle Theft", SeqID=1)
        csh_mur = CrimeSubHead(CrimeHeadID=ch_body.CrimeHeadID, CrimeHeadName="Murder", SeqID=1)
        session.add_all([csh_veh, csh_mur])
        await session.flush()

        # Add CrimeHeadActSection
        chas_1 = CrimeHeadActSection(CrimeHeadID=ch_theft.CrimeHeadID, ActCode=act_ipc.ActCode, SectionCode=sec_379.SectionCode)
        chas_2 = CrimeHeadActSection(CrimeHeadID=ch_body.CrimeHeadID, ActCode=act_ipc.ActCode, SectionCode=sec_302.SectionCode)
        session.add_all([chas_1, chas_2])
        await session.flush()

        # 2. Cases
        # Generate 20 synthetic cases spread across stations and types
        base_date = datetime.utcnow() - timedelta(days=60)
        
        for i in range(1, 21):
            is_theft = (i % 2 == 0)
            unit = unit_1 if i <= 10 else unit_2
            ch = ch_theft if is_theft else ch_body
            csh = csh_veh if is_theft else csh_mur
            grav = grav_non if is_theft else grav_hei
            status = status_clo if i % 5 == 0 else status_inv
            
            # Bangalore lat/lon roughly 12.97, 77.59 with slight variations
            lat = 12.9716 + random.uniform(-0.05, 0.05)
            lon = 77.5946 + random.uniform(-0.05, 0.05)
            
            cdate = base_date + timedelta(days=i*2)

            case = CaseMaster(
                CrimeNo=f"1044300062026{i:05d}",
                CaseNo=f"2026{i:05d}",
                CrimeRegisteredDate=cdate.date(),
                IncidentFromDate=cdate - timedelta(hours=5),
                IncidentToDate=cdate - timedelta(hours=4),
                InfoReceivedPSDate=cdate,
                latitude=lat,
                longitude=lon,
                BriefFacts=f"DEMO_Synthetic Case description {i} for {'Vehicle Theft' if is_theft else 'Murder'}",
                PolicePersonID=emp.EmployeeID,
                PoliceStationID=unit.UnitID,
                CaseCategoryID=cat_fir.CaseCategoryID,
                GravityOffenceID=grav.GravityOffenceID,
                CrimeMajorHeadID=ch.CrimeHeadID,
                CrimeMinorHeadID=csh.CrimeSubHeadID,
                CaseStatusID=status.CaseStatusID,
                CourtID=court_1.CourtID
            )
            session.add(case)
            await session.flush()
            
            # Association
            assoc = ActSectionAssociation(
                CaseMasterID=case.CaseMasterID,
                ActID=act_ipc.ActCode,
                SectionID=sec_379.SectionCode if is_theft else sec_302.SectionCode,
                ActOrderID=1,
                SectionOrderID=1
            )
            session.add(assoc)

            # People
            comp = ComplainantDetails(
                CaseMasterID=case.CaseMasterID,
                ComplainantName=f"DEMO_Complainant_{i}",
                AgeYear=30 + (i % 10),
                OccupationID=occ.OccupationID,
                ReligionID=religion.ReligionID,
                CasteID=caste.caste_master_id,
                GenderID=1
            )
            vic = Victim(
                CaseMasterID=case.CaseMasterID,
                VictimName=f"DEMO_Victim_{i}",
                AgeYear=25 + (i % 10),
                GenderID=1,
                VictimPolice="0"
            )
            acc = Accused(
                CaseMasterID=case.CaseMasterID,
                AccusedName=f"DEMO_Accused_{i}",
                AgeYear=35 + (i % 10),
                GenderID=1,
                PersonID=f"A{i}"
            )
            session.add_all([comp, vic, acc])
            await session.flush()

            # --- Case status history: registered -> under investigation -> (closed) ---
            session.add(CaseStatusHistory(
                CaseMasterID=case.CaseMasterID,
                CaseStatusID=status_inv.CaseStatusID,
                ChangedDate=cdate,
                ChangedByID=emp.EmployeeID,
                Remarks="DEMO_Case registered and taken up for investigation",
            ))
            if status.CaseStatusID == status_clo.CaseStatusID:
                session.add(CaseStatusHistory(
                    CaseMasterID=case.CaseMasterID,
                    CaseStatusID=status_clo.CaseStatusID,
                    ChangedDate=cdate + timedelta(days=30),
                    ChangedByID=emp.EmployeeID,
                    Remarks="DEMO_Case closed after investigation",
                ))

            # --- Chargesheet: filed for every closed case ---
            if status.CaseStatusID == status_clo.CaseStatusID:
                session.add(ChargesheetDetails(
                    CaseMasterID=case.CaseMasterID,
                    csdate=cdate + timedelta(days=25),
                    cstype="F",  # Final chargesheet
                    PolicePersonID=emp.EmployeeID,
                ))

            # --- Arrest/surrender record for every other case ---
            arrest = None
            if i % 2 == 0:
                arrest = ArrestSurrender(
                    CaseMasterID=case.CaseMasterID,
                    ArrestSurrenderTypeID=1,
                    ArrestSurrenderDate=cdate.date() + timedelta(days=2),
                    ArrestSurrenderStateId=state_ka.StateID,
                    ArrestSurrenderDistrictId=dist_blr.DistrictID,
                    PoliceStationID=unit.UnitID,
                    IOID=emp.EmployeeID,
                    CourtID=court_1.CourtID,
                    AccusedMasterID=acc.AccusedMasterID,
                    IsAccused=True,
                    IsComplainantAccused=False,
                )
                session.add(arrest)
                await session.flush()
                session.add(InvArrestSurrenderAccused(
                    ArrestSurrenderID=arrest.ArrestSurrenderID,
                    AccusedMasterID=acc.AccusedMasterID,
                ))

            # --- Biometric record for the accused (fingerprint capture) ---
            # Case #3's accused and case #13's accused deliberately SHARE the
            # same BiometricRefID, simulating the same real person showing up
            # under two different case files (a repeat offender) — this is
            # what /biometrics/search is meant to catch.
            if i in (3, 13):
                ref_id = "FP-SHARED-003"
            else:
                ref_id = f"FP-{i:05d}"

            session.add(BiometricRecord(
                AccusedMasterID=acc.AccusedMasterID,
                BiometricType="FINGERPRINT",
                BiometricRefID=ref_id,
                CapturedDate=cdate.date(),
                CapturedByID=emp.EmployeeID,
                Remarks=f"DEMO_Fingerprint captured at booking for case {i}",
            ))

        await session.commit()
        print("Database successfully seeded with synthetic demo data!")

        # Print report
        cases_cnt = (await session.execute(select(CaseMaster))).scalars().all()
        print(f"Total CaseMaster records: {len(cases_cnt)}")

asyncio.run(seed_data())

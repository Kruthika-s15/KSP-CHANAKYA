import asyncio
from datetime import date, datetime, timedelta
import random
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

from app.core.config import settings
from app.db.base import Base
from app.models import (
    State, District, Court, UnitType, Unit, CasteMaster, ReligionMaster, OccupationMaster,
    CaseStatusMaster, CaseCategory, GravityOffence, Rank, Designation, Employee,
    Act, Section, CrimeHead, CrimeSubHead, CrimeHeadActSection, CaseMaster,
    ActSectionAssociation, ComplainantDetails, Victim, Accused,
    ComplainantDetails, Victim, Accused,
    ChargesheetDetails, ArrestSurrender, InvArrestSurrenderAccused,
    BiometricRecord, CaseStatusHistory, CaseEvidence,
)

# Use synchronous string if asyncpg has issues, but we are using asyncpg.
engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def check_if_seeded(session: AsyncSession) -> bool:
    result = await session.execute(select(State).limit(1))
    return result.first() is not None

async def seed_data():
    is_seeded = False
    async with AsyncSessionLocal() as session:
        is_seeded = await check_if_seeded(session)
        
    async with engine.begin() as conn:
        if is_seeded:
            print("Dropping existing tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)

    print("Tables created. Beginning data seeding...")

    async with AsyncSessionLocal() as session:
        # --- Predefined Realistic Data ---
        accused_names = [
            "Anand Spider Kulkarni", "Basavaraj Pandav Hegde", "Chetan Speed Deshpande",
            "Dinesh Tiger Rai", "Guru Don Badiger", "John Doe", "Lokesh Kabali Swamy",
            "Mahesh Daba Patil", "Manjunath Local Bhat", "Nagaraj Snake Poojary",
            "Prakash Gooli Biradar", "Ramesh Kolar Shetty", "Santosh Bullet Nayak",
            "Shankar Gowda", "Sunil Blackie Kambali", "Suresh Phantom Reddy",
            "Venkatesh Metro Murthy", "Vinay Shadow Kumar"
        ]
        
        complainant_names = [
            "Ramesh Kumar", "Suresh Gowda", "Manjula Shetty", "Venkat Rao", 
            "Priya Desai", "Lakshmi N", "Anil Kumar", "Karthik Raj", 
            "Meena Patil", "Radha Menon"
        ]
        
        victim_names = [
            "Deepak Sharma", "Sunita Verma", "Ravi Shankar", "Gita Iyer", 
            "Naveen Babu", "Rakesh Singh", "Geeta Bhat", "Prasad Reddy", 
            "Shiva Kumar", "Pooja Hegde"
        ]

        theft_facts = [
            "Complainant reported that their two-wheeler, a Honda Activa bearing registration KA-01-EH-1234, was stolen from the parking lot of Orion Mall between 14:00 and 16:00 hrs. CCTV footage shows an unidentified male suspect tampering with the ignition.",
            "A Bajaj Pulsar motorcycle was stolen from outside the complainant's residence on 4th Main Road, Jayanagar during the night. The vehicle handle lock was broken. Neighbors reported seeing two men loitering near the house at 2:00 AM.",
            "Complainant parked their Maruti Swift car near Commercial Street for shopping. Upon returning after 2 hours, the vehicle was missing. Broken glass pieces were found at the parking spot indicating forced entry.",
            "A commercial goods vehicle loaded with electronic appliances was hijacked on the Hosur Highway near Electronic City. Three men in an SUV intercepted the truck and forced the driver out at knifepoint before driving away with the cargo.",
            "Complainant's Royal Enfield Classic 350 was lifted from the basement parking of their apartment complex in Indiranagar. The security guard was on a break. The theft was discovered the next morning when the complainant was leaving for work."
        ]

        murder_facts = [
            "A violent altercation occurred at a local bar in Koramangala, resulting in the fatal stabbing of the victim. Eyewitnesses state the dispute began over a financial disagreement. The suspect fled the scene in an auto-rickshaw.",
            "Victim was found deceased in their apartment in Whitefield with blunt force trauma to the head. There were signs of forced entry and the house was ransacked, suggesting a burglary gone wrong. A blood-stained crowbar was recovered nearby.",
            "Body of an unidentified male, approximately 35 years old, was discovered in an empty plot near Yelahanka. The victim had sustained multiple gunshot wounds. Police suspect gang rivalry as the primary motive.",
            "A heated domestic dispute escalated, leading to the murder of the victim by their spouse. Neighbors heard shouting and called the police, but the victim had succumbed to injuries by the time authorities arrived. The weapon was a kitchen knife.",
            "Victim was ambushed while returning home from work in JP Nagar. Three masked individuals attacked the victim with machetes. Investigation points towards an ongoing property dispute between the victim and their extended family."
        ]

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
        unit_3 = Unit(UnitName="DEMO_Electronic City PS", TypeID=ut_ps.UnitTypeID, StateID=state_ka.StateID, DistrictID=dist_blr.DistrictID, Active=True, ParentUnit=0, NationalityID=1)
        unit_4 = Unit(UnitName="DEMO_Whitefield PS", TypeID=ut_ps.UnitTypeID, StateID=state_ka.StateID, DistrictID=dist_blr.DistrictID, Active=True, ParentUnit=0, NationalityID=1)
        unit_5 = Unit(UnitName="DEMO_Jayanagar PS", TypeID=ut_ps.UnitTypeID, StateID=state_ka.StateID, DistrictID=dist_blr.DistrictID, Active=True, ParentUnit=0, NationalityID=1)
        unit_6 = Unit(UnitName="DEMO_HSR Layout PS", TypeID=ut_ps.UnitTypeID, StateID=state_ka.StateID, DistrictID=dist_blr.DistrictID, Active=True, ParentUnit=0, NationalityID=1)
        
        session.add_all([unit_1, unit_2, unit_3, unit_4, unit_5, unit_6])
        await session.flush()
        units = [unit_1, unit_2, unit_3, unit_4, unit_5, unit_6]

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
        ch_cyber = CrimeHead(CrimeGroupName="DEMO_Cyber Crime", Active=True)
        ch_fraud = CrimeHead(CrimeGroupName="DEMO_Financial Fraud", Active=True)
        ch_prop = CrimeHead(CrimeGroupName="DEMO_Crimes Against Property", Active=True)
        ch_narc = CrimeHead(CrimeGroupName="DEMO_Narcotics", Active=True)
        session.add_all([ch_theft, ch_body, ch_cyber, ch_fraud, ch_prop, ch_narc])
        await session.flush()

        csh_veh = CrimeSubHead(CrimeHeadID=ch_theft.CrimeHeadID, CrimeHeadName="Vehicle Theft", SeqID=1)
        csh_mur = CrimeSubHead(CrimeHeadID=ch_body.CrimeHeadID, CrimeHeadName="Murder", SeqID=1)
        csh_phish = CrimeSubHead(CrimeHeadID=ch_cyber.CrimeHeadID, CrimeHeadName="Phishing", SeqID=1)
        csh_ident = CrimeSubHead(CrimeHeadID=ch_cyber.CrimeHeadID, CrimeHeadName="Identity Theft", SeqID=2)
        csh_embez = CrimeSubHead(CrimeHeadID=ch_fraud.CrimeHeadID, CrimeHeadName="Embezzlement", SeqID=1)
        csh_burg = CrimeSubHead(CrimeHeadID=ch_prop.CrimeHeadID, CrimeHeadName="Burglary", SeqID=1)
        csh_vand = CrimeSubHead(CrimeHeadID=ch_prop.CrimeHeadID, CrimeHeadName="Vandalism", SeqID=2)
        csh_drug = CrimeSubHead(CrimeHeadID=ch_narc.CrimeHeadID, CrimeHeadName="Drug Trafficking", SeqID=1)
        session.add_all([csh_veh, csh_mur, csh_phish, csh_ident, csh_embez, csh_burg, csh_vand, csh_drug])
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
            crime_cats = [
                (ch_theft, csh_veh, grav_non, random.choice(theft_facts)),
                (ch_body, csh_mur, grav_hei, random.choice(murder_facts)),
                (ch_cyber, random.choice([csh_phish, csh_ident]), grav_non, "Complainant reported unauthorized access to their bank account resulting in fraudulent transfers."),
                (ch_fraud, csh_embez, grav_hei, "Investigation revealed systematic siphoning of company funds over a period of six months by a trusted employee."),
                (ch_prop, random.choice([csh_burg, csh_vand]), grav_non, "Unknown miscreants broke into the warehouse and destroyed property, in addition to stealing valuable equipment."),
                (ch_narc, csh_drug, grav_hei, "Acting on a tip-off, police intercepted a vehicle carrying illicit substances meant for distribution.")
            ]
            
            ch, csh, grav, case_facts = random.choice(crime_cats)
            
            unit = random.choice(units)
            status = status_clo if i % 5 == 0 else status_inv
            
            # Bangalore lat/lon roughly 12.97, 77.59 with slight variations
            lat = 12.9716 + random.uniform(-0.05, 0.05)
            lon = 77.5946 + random.uniform(-0.05, 0.05)
            
            cdate = base_date + timedelta(days=i*2)

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
                BriefFacts=case_facts,
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
                SectionID=sec_302.SectionCode if grav == grav_hei else sec_379.SectionCode,
                ActOrderID=1,
                SectionOrderID=1
            )
            session.add(assoc)

            # People
            comp = ComplainantDetails(
                CaseMasterID=case.CaseMasterID,
                ComplainantName=random.choice(complainant_names),
                AgeYear=30 + (i % 10),
                OccupationID=occ.OccupationID,
                ReligionID=religion.ReligionID,
                CasteID=caste.caste_master_id,
                GenderID=1
            )
            vic = Victim(
                CaseMasterID=case.CaseMasterID,
                VictimName=random.choice(victim_names),
                AgeYear=25 + (i % 10),
                GenderID=1,
                VictimPolice="0"
            )
            # To create rich connections in the network graph, we make some people repeat offenders.
            # "Anand Spider Kulkarni" (index 0) is a mastermind involved in every 5th case.
            # "John Doe" (index 5) is involved in every 7th case.
            if i % 5 == 0:
                acc_index = 0
            elif i % 7 == 0:
                acc_index = 5
            else:
                acc_index = i % len(accused_names)

            acc_name = accused_names[acc_index]
            person_id = f"P-{(acc_index + 1):03d}"

            acc = Accused(
                CaseMasterID=case.CaseMasterID,
                AccusedName=acc_name,
                AgeYear=35 + (acc_index % 10),
                GenderID=1,
                PersonID=person_id
            )
            session.add_all([comp, vic, acc])
            await session.flush()

            # --- Case status history: registered -> under investigation -> (closed) ---
            session.add(CaseStatusHistory(
                CaseMasterID=case.CaseMasterID,
                CaseStatusID=status_inv.CaseStatusID,
                ChangedDate=cdate,
                ChangedByID=emp.EmployeeID,
                Remarks="FIR registered. Case assigned to Investigating Officer. Initial spot inspection completed.",
            ))
            if status.CaseStatusID == status_clo.CaseStatusID:
                session.add(CaseStatusHistory(
                    CaseMasterID=case.CaseMasterID,
                    CaseStatusID=status_clo.CaseStatusID,
                    ChangedDate=cdate + timedelta(days=30),
                    ChangedByID=emp.EmployeeID,
                    Remarks="Investigation concluded. Sufficient evidence gathered. Final chargesheet prepared and submitted to court.",
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
            # Shared ref_id allows the biometric system and network graph to link identities.
            ref_id = f"FP-{(acc_index + 1):03d}"

            session.add(BiometricRecord(
                AccusedMasterID=acc.AccusedMasterID,
                BiometricType="FINGERPRINT",
                BiometricRefID=ref_id,
                CapturedDate=cdate.date(),
                CapturedByID=emp.EmployeeID,
                Remarks=f"Fingerprint captured at booking desk. Subject cooperated. Automated AFIS enrollment successful.",
            ))

            # --- Evidence (Medical Report) for Murder/Body Cases ---
            if ch == ch_body:
                # A minimal valid PDF document byte string
                dummy_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n4 0 obj\n<< /Length 53 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Medical Examination Report) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000288 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n390\n%%EOF\n"
                session.add(CaseEvidence(
                    CaseMasterID=case.CaseMasterID,
                    FileName=f"Medical_Report_Case_{case.CaseNo}.pdf",
                    FileType="pdf",
                    MimeType="application/pdf",
                    FileData=dummy_pdf,
                    Description="Post-mortem and initial medical examination report from forensics.",
                    UploadedAt=cdate,
                ))

        await session.commit()
        print("Database successfully seeded with synthetic demo data!")

        # Print report
        cases_cnt = (await session.execute(select(CaseMaster))).scalars().all()
        print(f"Total CaseMaster records: {len(cases_cnt)}")

asyncio.run(seed_data())

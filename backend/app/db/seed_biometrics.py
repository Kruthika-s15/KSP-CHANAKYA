import asyncio
import os
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.db.session import AsyncSessionLocal
from app.models.case import CaseMaster
from app.models.people import Accused
from app.models.biometric import BiometricRecord
from app.models.master import District, Unit, CaseStatusMaster
from app.models.legal import CrimeHead

DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "dataset")

SUSPECT_NAMES = [
    'Anand Kulkarni', 'Prakash Biradar', 'Dinesh Rai', 'Lokesh Swamy', 
    'Manjunath Bhat', 'Chetan Deshpande', 'Guru Badiger', 'Venkatesh Murthy', 
    'Shankar Gowda', 'Nagaraj Poojary', 'Ramesh Shetty', 'Mahesh Patil', 
    'Santosh Nayak', 'Basavaraj Hegde', 'Vinay Kumar', 'Suresh Reddy'
]

POLICE_STATIONS = [
    ("M.G. Road PS", "Bengaluru Urban"),
    ("Vidyaranyapura PS", "Bengaluru Urban"),
    ("Indiranagar PS", "Bengaluru Urban"),
    ("Jayanagar PS", "Bengaluru South"),
    ("Keshwapur PS", "Dharwad"),
    ("Vidyanagar PS", "Hubballi-Dharwad"),
    ("Kadri PS", "Dakshina Kannada"),
    ("Lashkar PS", "Mysuru")
]

CRIME_CATEGORIES = [
    "Cyber Fraud (BNS Sec. 318)", "House Theft", "Chain Snatching", 
    "Robbery", "Extortion", "Financial Fraud"
]

CASE_STATUSES = [
    "Under Investigation", "Chargesheet Filed", "Absconding", "In Custody", "Bail Granted"
]

async def get_or_create_district(session: AsyncSession, district_name: str) -> int:
    result = await session.execute(select(District).filter_by(DistrictName=district_name))
    dist = result.scalars().first()
    if not dist:
        dist = District(DistrictName=district_name, Active=True)
        session.add(dist)
        await session.flush()
    return dist.DistrictID

async def get_or_create_unit(session: AsyncSession, unit_name: str, district_id: int) -> int:
    result = await session.execute(select(Unit).filter_by(UnitName=unit_name, DistrictID=district_id))
    unit = result.scalars().first()
    if not unit:
        unit = Unit(UnitName=unit_name, DistrictID=district_id, Active=True)
        session.add(unit)
        await session.flush()
    return unit.UnitID

async def get_or_create_crime_head(session: AsyncSession, head_name: str) -> int:
    result = await session.execute(select(CrimeHead).filter_by(CrimeGroupName=head_name))
    ch = result.scalars().first()
    if not ch:
        ch = CrimeHead(CrimeGroupName=head_name)
        session.add(ch)
        await session.flush()
    return ch.CrimeHeadID

async def get_or_create_status(session: AsyncSession, status_name: str) -> int:
    result = await session.execute(select(CaseStatusMaster).filter_by(CaseStatusName=status_name))
    st = result.scalars().first()
    if not st:
        st = CaseStatusMaster(CaseStatusName=status_name)
        session.add(st)
        await session.flush()
    return st.CaseStatusID

async def seed_dataset():
    print(f"Scanning dataset directory: {DATASET_DIR}")
    if not os.path.exists(DATASET_DIR):
        print("Dataset directory not found.")
        return

    async with AsyncSessionLocal() as session:
        # 1. Clean existing mock data
        print("Cleaning old biometric mock data...")
        await session.execute(delete(BiometricRecord))
        
        mock_cases_query = select(CaseMaster.CaseMasterID).filter(
            CaseMaster.CrimeNo.like('FIR-2026-%') | CaseMaster.CrimeNo.like('CR-MOCK-%')
        )
        mock_cases = await session.execute(mock_cases_query)
        mock_case_ids = mock_cases.scalars().all()
        
        if mock_case_ids:
            await session.execute(delete(Accused).filter(Accused.CaseMasterID.in_(mock_case_ids)))
            await session.execute(delete(CaseMaster).filter(CaseMaster.CaseMasterID.in_(mock_case_ids)))
        
        await session.flush()

        # 2. Collect dataset files
        files = [f for f in os.listdir(DATASET_DIR) if f.lower().endswith(('.bmp', '.png', '.jpg'))]
        if not files:
            print("No valid images found in dataset.")
            return

        # 3. Create relational entries
        print("\nSeeding new realistic offender profiles...")
        print("-" * 110)
        print(f"{'FIR NUMBER':<16} | {'SUSPECT NAME':<20} | {'CRIME CATEGORY':<28} | {'POLICE STATION (DISTRICT)':<30}")
        print("-" * 110)

        for idx, filename in enumerate(files):
            filepath = os.path.join(DATASET_DIR, filename)
            
            # Random selections
            suspect_name = SUSPECT_NAMES[idx % len(SUSPECT_NAMES)]
            ps_name, dist_name = random.choice(POLICE_STATIONS)
            crime_cat = random.choice(CRIME_CATEGORIES)
            case_status = random.choice(CASE_STATUSES)
            fir_no = f"FIR-2026-{random.randint(100, 9999):04d}"
            
            # Get or create lookups
            dist_id = await get_or_create_district(session, dist_name)
            unit_id = await get_or_create_unit(session, ps_name, dist_id)
            crime_head_id = await get_or_create_crime_head(session, crime_cat)
            status_id = await get_or_create_status(session, case_status)

            # Create CaseMaster
            new_case = CaseMaster(
                CrimeNo=fir_no,
                CaseNo=f"CASE-{fir_no}",
                PoliceStationID=unit_id,
                CrimeMajorHeadID=crime_head_id,
                CaseStatusID=status_id,
                BriefFacts=f"Incident involving {suspect_name} registered at {ps_name}."
            )
            session.add(new_case)
            await session.flush()

            # Create Accused
            new_accused = Accused(
                CaseMasterID=new_case.CaseMasterID,
                AccusedName=suspect_name
            )
            session.add(new_accused)
            await session.flush()

            # Create BiometricRecord
            new_biometric = BiometricRecord(
                AccusedMasterID=new_accused.AccusedMasterID,
                BiometricType="FINGERPRINT",
                BiometricRefID=filename,
                Remarks=filepath
            )
            session.add(new_biometric)
            
            # Print row
            ps_dist_display = f"{ps_name} ({dist_name})"
            print(f"{fir_no:<16} | {suspect_name:<20} | {crime_cat:<28} | {ps_dist_display:<30}")

        await session.commit()
        print("-" * 110)
        print(f"\nSuccessfully seeded {len(files)} realistic biometric profiles.")

if __name__ == "__main__":
    asyncio.run(seed_dataset())

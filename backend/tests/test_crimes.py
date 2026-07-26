import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_get_crimes_list(async_client: AsyncClient):
    resp = await async_client.get(f"{settings.API_V1_STR}/crimes")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] > 0
    assert len(data["items"]) <= 20

@pytest.mark.asyncio
async def test_search_crimes(async_client: AsyncClient):
    resp = await async_client.get(f"{settings.API_V1_STR}/crimes/search")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data

@pytest.mark.asyncio
async def test_get_categories(async_client: AsyncClient):
    resp = await async_client.get(f"{settings.API_V1_STR}/crimes/categories")
    assert resp.status_code == 200
    data = resp.json()
    assert "crime_heads" in data
    assert "districts" in data
    assert len(data["districts"]) > 0

@pytest.mark.asyncio
async def test_get_single_case_and_people(async_client: AsyncClient):
    resp = await async_client.get(f"{settings.API_V1_STR}/crimes?page_size=1")
    data = resp.json()
    if data["total"] > 0:
        case_id = data["items"][0]["CaseMasterID"]
        
        c_resp = await async_client.get(f"{settings.API_V1_STR}/crimes/{case_id}")
        assert c_resp.status_code == 200
        assert c_resp.json()["CaseMasterID"] == case_id
        
        p_resp = await async_client.get(f"{settings.API_V1_STR}/crimes/{case_id}/people")
        assert p_resp.status_code == 200
        p_data = p_resp.json()
        assert "complainants" in p_data
        assert "accused" in p_data

@pytest.mark.asyncio
async def test_get_invalid_case(async_client: AsyncClient):
    resp = await async_client.get(f"{settings.API_V1_STR}/crimes/9999999")
    assert resp.status_code == 404

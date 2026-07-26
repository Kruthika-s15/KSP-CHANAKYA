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
async def test_network_overview(async_client: AsyncClient):
    resp = await async_client.get(f"{settings.API_V1_STR}/network", params={"limit_cases": 10})
    assert resp.status_code == 200
    data = resp.json()
    assert "nodes" in data and "edges" in data
    assert data["total_nodes"] == len(data["nodes"])
    assert data["total_edges"] == len(data["edges"])
    # Every edge must reference nodes that actually exist in the graph.
    node_ids = {n["id"] for n in data["nodes"]}
    for e in data["edges"]:
        assert e["source"] in node_ids
        assert e["target"] in node_ids


@pytest.mark.asyncio
async def test_network_overview_respects_limit(async_client: AsyncClient):
    resp = await async_client.get(f"{settings.API_V1_STR}/network", params={"limit_cases": 5})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_cases"] <= 5


@pytest.mark.asyncio
async def test_network_for_case(async_client: AsyncClient):
    list_resp = await async_client.get(f"{settings.API_V1_STR}/crimes?page_size=1")
    list_data = list_resp.json()
    if list_data["total"] == 0:
        pytest.skip("No seeded cases available")
    case_id = list_data["items"][0]["CaseMasterID"]

    resp = await async_client.get(f"{settings.API_V1_STR}/network/case/{case_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["focus_case_id"] == case_id
    focus_nodes = [n for n in data["nodes"] if n["type"] == "case" and n["case_master_id"] == case_id]
    assert len(focus_nodes) == 1
    assert focus_nodes[0]["is_focus"] is True


@pytest.mark.asyncio
async def test_network_for_invalid_case(async_client: AsyncClient):
    resp = await async_client.get(f"{settings.API_V1_STR}/network/case/9999999")
    assert resp.status_code == 404

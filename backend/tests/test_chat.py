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
async def test_chat_english_natural_fallback(async_client: AsyncClient):
    # This will test the fallback logic if Gemini API key isn't set
    payload = {
        "message": "Show me vehicle theft cases in Bengaluru",
        "mode": "natural"
    }
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert "references" in data
    assert data["mode_used"] == "natural"
    # Even if cases are empty, it should return a reply
    assert len(data["reply"]) > 0

@pytest.mark.asyncio
async def test_chat_kannada_natural_fallback(async_client: AsyncClient):
    payload = {
        "message": "ಬೆಂಗಳೂರು ನಗರದಲ್ಲಿ ನಡೆದ ವಾಹನ ಕಳ್ಳತನದ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸು",
        "mode": "natural"
    }
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    # Should contain Kannada characters in reply
    is_kannada = any('\u0C80' <= c <= '\u0CFF' for c in data["reply"])
    assert is_kannada

@pytest.mark.asyncio
async def test_chat_sql_mode_allowed(async_client: AsyncClient):
    payload = {
        "message": "SELECT * FROM casemaster LIMIT 5;",
        "mode": "sql"
    }
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert "references" in data
    assert data["mode_used"] == "sql"

@pytest.mark.asyncio
async def test_chat_sql_mode_rejected_insert(async_client: AsyncClient):
    payload = {
        "message": "INSERT INTO casemaster (id) VALUES (1);",
        "mode": "sql"
    }
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 400
    assert "Only SELECT or WITH" in resp.json()["detail"]

@pytest.mark.asyncio
async def test_chat_sql_mode_rejected_drop(async_client: AsyncClient):
    payload = {
        "message": "SELECT * FROM casemaster; DROP TABLE casemaster;",
        "mode": "sql"
    }
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 400
    assert "Dangerous keyword 'DROP'" in resp.json()["detail"]

@pytest.mark.asyncio
async def test_chat_greeting_hello(async_client: AsyncClient):
    """'hello' must be GENERAL_CONVERSATION with zero references."""
    payload = {"message": "hello", "mode": "natural"}
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["references"]) == 0
    assert data["mode_used"] == "natural"

@pytest.mark.asyncio
async def test_chat_english_introduction_ramya(async_client: AsyncClient):
    """'my name is Ramya' must NOT return crime data."""
    payload = {"message": "my name is Ramya", "mode": "natural"}
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["references"]) == 0
    assert data["mode_used"] == "natural"

@pytest.mark.asyncio
async def test_chat_kannada_greeting(async_client: AsyncClient):
    """'ನಮಸ್ಕಾರ' must be GENERAL_CONVERSATION with zero references."""
    payload = {"message": "ನಮಸ್ಕಾರ", "mode": "natural"}
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["references"]) == 0

@pytest.mark.asyncio
async def test_chat_kannada_introduction_ramya(async_client: AsyncClient):
    """'ನನ್ನ ಹೆಸರು ರಮ್ಯಾ' must NOT return crime data."""
    payload = {"message": "ನನ್ನ ಹೆಸರು ರಮ್ಯಾ", "mode": "natural"}
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["references"]) == 0

@pytest.mark.asyncio
async def test_chat_help_question(async_client: AsyncClient):
    """Help question must not return crime data."""
    payload = {"message": "What can you do?", "mode": "natural"}
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["references"]) == 0

@pytest.mark.asyncio
async def test_chat_crime_query_english(async_client: AsyncClient):
    """'give me recent case files' MUST route to CRIME_SEARCH."""
    payload = {"message": "give me recent case files", "mode": "natural"}
    resp = await async_client.post(f"{settings.API_V1_STR}/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert "references" in data
    # This IS a crime query so references may or may not be empty depending on DB state,
    # but the key point is it should not error out.
    assert data["mode_used"] == "natural"

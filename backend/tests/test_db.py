import pytest
from app.db.session import check_db_health

@pytest.mark.asyncio
async def test_database_connectivity():
    """
    Test basic database connectivity using the health check.
    If PostgreSQL is not running locally, this test will fail.
    """
    is_healthy = await check_db_health()
    assert is_healthy == True, "Database connection failed. Ensure PostgreSQL is running and DATABASE_URL is correct."

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker


async def get_async_db() -> AsyncGenerator[AsyncSession]:
    """
    Provides an asynchronous SQLAlchemy session for working with a PostgreSQL database.
    """
    async with async_session_maker() as session:
        yield session

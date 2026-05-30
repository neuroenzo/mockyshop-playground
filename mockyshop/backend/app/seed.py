import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.auth import hash_password
from app.database import async_session_maker
from app.models.users import User as UserModel


async def seed_admin() -> None:
    email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    password = os.getenv("ADMIN_PASSWORD", "admin123")

    async with async_session_maker() as db:
        result = await db.scalars(select(UserModel).where(UserModel.email == email))
        if result.first():
            print(f"Admin user '{email}' already exists, skipping.")
            return

        db_user = UserModel(
            email=email,
            hashed_password=hash_password(password),
            role="admin",
            is_active=True,
        )
        db.add(db_user)
        await db.commit()
        print(f"Created admin user: {email}")


if __name__ == "__main__":
    asyncio.run(seed_admin())

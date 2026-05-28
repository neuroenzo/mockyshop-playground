from faker import Faker

from app.auth import hash_password
from app.models.users import User

fake = Faker()


class UserFactory:
    @classmethod
    async def create(cls, db, **overrides) -> User:
        email = overrides.pop("email", fake.email())
        raw_password = overrides.pop("raw_password", "TestPass123")
        role = overrides.get("role", "buyer")
        is_active = overrides.get("is_active", True)

        user = User(
            email=email,
            hashed_password=hash_password(raw_password),
            role=role,
            is_active=is_active,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

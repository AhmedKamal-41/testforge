from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.security import verify_password


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

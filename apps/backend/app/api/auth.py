from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.auth import LoginIn, TokenOut, UserOut
from app.schemas.common import Message
from app.security import create_access_token
from app.services.auth import authenticate

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid email or password"
        )
    token = create_access_token(subject=user.id, extra_claims={"role": user.role})
    return TokenOut(access_token=token)


@router.post("/logout", response_model=Message)
def logout(_: User = Depends(get_current_user)) -> Message:
    # JWT is stateless: client discards the token. Endpoint exists so the UI has
    # a single place to call and so we can add a blocklist later without churning the API.
    return Message(detail="logged out")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user

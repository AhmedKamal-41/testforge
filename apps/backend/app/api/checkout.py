from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.order import OrderOut
from app.services.checkout import CheckoutError, checkout

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def post_checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return checkout(db, current_user)
    except CheckoutError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

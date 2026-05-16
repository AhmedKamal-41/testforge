from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.cart import CartItemAddIn, CartItemOut, CartOut
from app.schemas.product import ProductOut
from app.services import cart as svc

router = APIRouter(prefix="/api/cart", tags=["cart"])


def _to_cart_out(items) -> CartOut:
    out_items = [
        CartItemOut(
            id=i.id,
            product=ProductOut.model_validate(i.product),
            quantity=i.quantity,
            line_total=Decimal(i.product.price) * i.quantity,
        )
        for i in items
    ]
    return CartOut(items=out_items, total=sum((it.line_total for it in out_items), Decimal("0")))


@router.get("", response_model=CartOut)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartOut:
    return _to_cart_out(svc.list_cart_items(db, current_user))


@router.post("/items", response_model=CartOut, status_code=status.HTTP_201_CREATED)
def add_item(
    payload: CartItemAddIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartOut:
    try:
        svc.add_item(db, current_user, payload.product_id, payload.quantity)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return _to_cart_out(svc.list_cart_items(db, current_user))


@router.delete("/items/{item_id}", response_model=CartOut)
def remove_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartOut:
    try:
        svc.remove_item(db, current_user, item_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return _to_cart_out(svc.list_cart_items(db, current_user))

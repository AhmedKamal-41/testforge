from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.product import ProductOut


class CartItemAddIn(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product: ProductOut
    quantity: int
    line_total: Decimal


class CartOut(BaseModel):
    items: list[CartItemOut]
    total: Decimal

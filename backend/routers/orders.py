from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncpg
from core.database import get_db
from core.security import require_admin

router = APIRouter()

class OrderItem(BaseModel):
    product_id: int
    quantity: int

class OrderBody(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = None
    address: Optional[str] = None
    total: float
    items: List[OrderItem]

class StatusBody(BaseModel):
    status: str

@router.post("/")
async def create_order(body: OrderBody, db: asyncpg.Connection = Depends(get_db)):
    async with db.transaction():
        order = await db.fetchrow(
            "INSERT INTO orders(customer_name,customer_phone,address,total) VALUES($1,$2,$3,$4) RETURNING *",
            body.customer_name, body.customer_phone, body.address, body.total
        )
        for item in body.items:
            price_row = await db.fetchrow("SELECT price FROM products WHERE id=$1", item.product_id)
            unit_price = price_row["price"] if price_row else 0
            await db.execute(
                "INSERT INTO order_items(order_id,product_id,quantity,unit_price) VALUES($1,$2,$3,$4)",
                order["id"], item.product_id, item.quantity, unit_price
            )
    return dict(order)

@router.get("/", dependencies=[Depends(require_admin)])
async def list_orders(db: asyncpg.Connection = Depends(get_db)):
    rows = await db.fetch("SELECT * FROM orders ORDER BY created_at DESC")
    return [dict(r) for r in rows]

@router.patch("/{order_id}/status", dependencies=[Depends(require_admin)])
async def update_order_status(order_id: int, body: StatusBody, db: asyncpg.Connection = Depends(get_db)):
    await db.execute("UPDATE orders SET status=$1 WHERE id=$2", body.status, order_id)
    return {"message": "Estado actualizado"}
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncpg
from core.database import get_db
from core.security import require_admin

router = APIRouter()

class ProductBody(BaseModel):
    name: str
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    stock: int = 0
    category: Optional[str] = None

@router.get("/")
async def list_products(db: asyncpg.Connection = Depends(get_db)):
    rows = await db.fetch("SELECT * FROM products ORDER BY created_at DESC")
    return [dict(r) for r in rows]

@router.post("/", dependencies=[Depends(require_admin)])
async def create_product(body: ProductBody, db: asyncpg.Connection = Depends(get_db)):
    row = await db.fetchrow(
        "INSERT INTO products(name,price,description,image_url,stock,category) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        body.name, body.price, body.description, body.image_url, body.stock, body.category
    )
    return dict(row)

@router.put("/{product_id}", dependencies=[Depends(require_admin)])
async def update_product(product_id: int, body: ProductBody, db: asyncpg.Connection = Depends(get_db)):
    row = await db.fetchrow(
        "UPDATE products SET name=$1,price=$2,description=$3,image_url=$4,stock=$5,category=$6,updated_at=NOW() WHERE id=$7 RETURNING *",
        body.name, body.price, body.description, body.image_url, body.stock, body.category, product_id
    )
    if not row:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return dict(row)

@router.delete("/{product_id}", dependencies=[Depends(require_admin)])
async def delete_product(product_id: int, db: asyncpg.Connection = Depends(get_db)):
    await db.execute("DELETE FROM products WHERE id=$1", product_id)
    return {"message": "Producto eliminado"}
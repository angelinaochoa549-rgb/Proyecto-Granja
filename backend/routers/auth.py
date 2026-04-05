from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg
from core.database import get_db
from core.security import verify_password, create_access_token

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def admin_login(body: LoginRequest, db: asyncpg.Connection = Depends(get_db)):
    row = await db.fetchrow("SELECT * FROM admins WHERE email = $1", body.email)
    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = create_access_token({"sub": row["email"], "admin_id": row["id"]})
    return {"access_token": token, "token_type": "bearer"}
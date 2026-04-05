"""
core/security.py
Utilidades de seguridad:
- Hashing de contraseñas con bcrypt
- Creación y verificación de JWT
"""

import os
from datetime import datetime, timedelta

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv_once = None

def _load_env():
    global load_dotenv_once
    if load_dotenv_once is None:
        from dotenv import load_dotenv
        load_dotenv()
        load_dotenv_once = True

_load_env()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_HOURS = 12

bearer_scheme = HTTPBearer()


# ─── Contraseñas ──────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Devuelve el hash bcrypt de una contraseña en texto plano."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con el hash."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ─── JWT ──────────────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """
    Genera un JWT con los datos provistos.
    Expira en TOKEN_EXPIRE_HOURS horas.
    """
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decodifica y valida un JWT. Lanza excepción si es inválido."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )


# ─── Dependency de autenticación ──────────────────────────────────────────────

async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI Dependency: protege rutas del panel admin.
    Uso: admin = Depends(require_admin)
    """
    return decode_token(credentials.credentials)
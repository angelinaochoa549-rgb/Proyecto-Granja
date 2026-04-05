"""
core/database.py
Conexión a PostgreSQL con asyncpg.
Compatible con Supabase.
"""

import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Pool de conexiones (se inicializa al arrancar la app)
_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """Retorna el pool de conexiones, creándolo si no existe."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=10,
            command_timeout=30,
        )
    return _pool


async def get_db():
    """
    Dependency de FastAPI para obtener una conexión de la pool.
    Uso: db: asyncpg.Connection = Depends(get_db)
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


async def create_tables():
    """
    Crea las tablas si no existen.
    Se ejecuta una vez al iniciar la app.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            -- Tabla de administradores
            CREATE TABLE IF NOT EXISTS admins (
                id          SERIAL PRIMARY KEY,
                email       VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at  TIMESTAMPTZ DEFAULT NOW()
            );

            -- Tabla de productos
            CREATE TABLE IF NOT EXISTS products (
                id          SERIAL PRIMARY KEY,
                name        VARCHAR(255) NOT NULL,
                price       NUMERIC(12,2) NOT NULL,
                description TEXT,
                image_url   TEXT,
                stock       INTEGER DEFAULT 0,
                category    VARCHAR(100),
                created_at  TIMESTAMPTZ DEFAULT NOW(),
                updated_at  TIMESTAMPTZ DEFAULT NOW()
            );

            -- Tabla de pedidos
            CREATE TABLE IF NOT EXISTS orders (
                id              SERIAL PRIMARY KEY,
                customer_name   VARCHAR(255) NOT NULL,
                customer_phone  VARCHAR(50),
                address         TEXT,
                total           NUMERIC(12,2) NOT NULL,
                status          VARCHAR(50) DEFAULT 'pendiente',
                created_at      TIMESTAMPTZ DEFAULT NOW()
            );

            -- Tabla de ítems de pedido
            CREATE TABLE IF NOT EXISTS order_items (
                id          SERIAL PRIMARY KEY,
                order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
                quantity    INTEGER NOT NULL,
                unit_price  NUMERIC(12,2)
            );
        """)
        print("✅ Tablas verificadas / creadas.")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.database import create_tables
from routers import auth, products, orders


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ejecuta tareas al iniciar la app (crear tablas si no existen)."""
    await create_tables()
    yield


app = FastAPI(
    title="Manjares Del Campo API",
    description="Backend para la tienda de productos de granja",
    version="1.0.0",
    lifespan=lifespan,
)

# =====================================================
# CORS — permite peticiones desde el frontend
# =====================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://proyecto-granja.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# ROUTERS
# =====================================================
app.include_router(auth.router,     prefix="/admin",    tags=["Autenticación"])
app.include_router(products.router, prefix="/products", tags=["Productos"])
app.include_router(orders.router,   prefix="/orders",   tags=["Pedidos"])


@app.get("/", tags=["Health"])
async def root():
    """Health check — verifica que el servidor esté corriendo."""
    return {"status": "ok", "message": "Manjares Del Campo API funcionando ✅"}
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.routers import admin, cart, categories, order, payment, products, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path("static/uploads/products").mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="MockyShop API",
    version="0.1.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

Path("static").mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(categories.router)
app.include_router(products.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(cart.router)
app.include_router(order.router)
app.include_router(payment.router)


@app.get("/")
async def root():
    """
    Root route confirming that the API is running.
    """

    return {"message": "Welcome to the MockyShop API!"}

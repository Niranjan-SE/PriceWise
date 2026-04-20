from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import products
from app.db import init_db
import uvicorn

app = FastAPI(title="PriceWise India API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/products", tags=["products"])

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/")
def root():
    return {"status": "PriceWise India API is running 🚀"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
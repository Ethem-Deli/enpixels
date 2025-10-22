from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ---------- Models ----------
class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    price: float
    currency: str = "USD"
    category_slug: Literal["digital", "prints", "local"]
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    currency: str = "USD"
    category_slug: Literal["digital", "prints", "local"]
    image_url: Optional[str] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int = 1

class Address(BaseModel):
    line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    notes: Optional[str] = None
    delivery_method: Literal["pickup", "delivery", "digital"] = "digital"
    address: Optional[Address] = None
    items: List[CartItem]
    subtotal: float
    delivery_fee: float
    total: float
    currency: str = "USD"
    status: Literal["created", "pending_payment", "paid", "fulfilled", "cancelled"] = "created"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    email: str
    name: str
    notes: Optional[str] = None
    delivery_method: Literal["pickup", "delivery", "digital"] = "digital"
    address: Optional[Address] = None
    items: List[CartItem]

class CheckoutSessionCreate(BaseModel):
    order_id: str

class CheckoutSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    payment_provider: str = "mock"
    checkout_url: str
    status: Literal["created", "completed"] = "created"

# ---------- Utilities ----------
async def serialize_datetime(doc: dict) -> dict:
    out = {**doc}
    for k, v in list(out.items()):
        if isinstance(v, datetime):
            out[k] = v.isoformat()
    return out

async def remove_mongo_id(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc

# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.get("/categories", response_model=List[Category])
async def list_categories():
    cats = await db.categories.find({}, {"_id": 0}).to_list(100)
    return cats

@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None, q: Optional[str] = None, limit: int = 50):
    query = {}
    if category:
        query["category_slug"] = category
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    # Convert created_at back to datetime
    for p in products:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])  # type: ignore
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])  # type: ignore
    return doc  # type: ignore

@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
    # Simple admin-less creation; keep for seeding/demo
    product = Product(**input.model_dump())
    doc = await serialize_datetime(product.model_dump())
    await db.products.insert_one(doc)
    return product

@api_router.post("/orders", response_model=Order)
async def create_order(input: OrderCreate):
    if not input.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Fetch products
    product_ids = [i.product_id for i in input.items]
    db_products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(100)
    prod_map = {p["id"]: p for p in db_products}
    # Validate all exist
    for item in input.items:
        if item.product_id not in prod_map:
            raise HTTPException(status_code=400, detail=f"Invalid product: {item.product_id}")

    # Compute subtotal
    subtotal = 0.0
    contains_physical = False
    for item in input.items:
        p = prod_map[item.product_id]
        subtotal += float(p["price"]) * item.quantity
        if p["category_slug"] in ["prints", "local"]:
            contains_physical = True

    # Delivery fee flat if delivery selected and physical items
    delivery_fee = 0.0
    if input.delivery_method == "delivery" and contains_physical:
        delivery_fee = 7.0

    total = round(subtotal + delivery_fee, 2)

    order = Order(
        email=input.email,
        name=input.name,
        notes=input.notes,
        delivery_method=input.delivery_method,
        address=input.address,
        items=input.items,
        subtotal=round(subtotal, 2),
        delivery_fee=delivery_fee,
        total=total,
    )
    doc = await serialize_datetime(order.model_dump())
    await db.orders.insert_one(doc)
    return order

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    # Cast timestamps
    for k in ["created_at"]:
        if isinstance(doc.get(k), str):
            doc[k] = datetime.fromisoformat(doc[k])
    return doc  # type: ignore

@api_router.post("/checkout/session", response_model=CheckoutSession)
async def create_checkout_session(input: CheckoutSessionCreate):
    # Mocked checkout session (no external provider yet)
    existing = await db.orders.find_one({"id": input.order_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    session = CheckoutSession(order_id=input.order_id, checkout_url=f"https://example.com/checkout/mock/{input.order_id}")
    await db.checkout_sessions.insert_one(session.model_dump())
    # Also set order status -> pending_payment
    await db.orders.update_one({"id": input.order_id}, {"$set": {"status": "pending_payment"}})
    return session

# ---------- Seed ----------
SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1667912100232-a457b313ec18?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1745173039229-416e2e6462d4?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1696787717706-d9d9fc9313fe?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1669975103315-42edfecb6632?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1669975103943-733ccbaa3d6b?auto=format&fit=crop&w=1600&q=80",
    "https://images.pexels.com/photos/6373516/pexels-photo-6373516.jpeg"
]

async def seed_data():
    # Categories
    cats = [
        {"id": str(uuid.uuid4()), "name": "Digital Downloads", "slug": "digital"},
        {"id": str(uuid.uuid4()), "name": "Prints", "slug": "prints"},
        {"id": str(uuid.uuid4()), "name": "Local Orders", "slug": "local"},
    ]
    existing = await db.categories.count_documents({})
    if existing == 0:
        await db.categories.insert_many(cats)

    # Products
    sample_products = [
        {
            "title": "Minimal Social Media Kit",
            "description": "Clean, modern templates for Instagram & TikTok.",
            "price": 18.0,
            "category_slug": "digital",
            "image_url": SAMPLE_IMAGES[1],
        },
        {
            "title": "Geometric Poster Pack",
            "description": "Abstract poster designs in high-res PNG & PSD.",
            "price": 22.0,
            "category_slug": "digital",
            "image_url": SAMPLE_IMAGES[2],
        },
        {
            "title": "Brand Mockup Set",
            "description": "Stationery & device mockups to showcase brands.",
            "price": 24.0,
            "category_slug": "digital",
            "image_url": SAMPLE_IMAGES[0],
        },
        {
            "title": "A3 Fine Art Print — Steps",
            "description": "Museum-grade matte paper print.",
            "price": 35.0,
            "category_slug": "prints",
            "image_url": SAMPLE_IMAGES[2],
        },
        {
            "title": "A2 Geometric Print",
            "description": "High contrast black & white composition.",
            "price": 45.0,
            "category_slug": "prints",
            "image_url": SAMPLE_IMAGES[1],
        },
        {
            "title": "Typography Study Print",
            "description": "Minimal typographic poster in gold accents.",
            "price": 42.0,
            "category_slug": "prints",
            "image_url": SAMPLE_IMAGES[3],
        },
        {
            "title": "Business Cards (Local)",
            "description": "Premium uncoated cards — pickup or delivery.",
            "price": 28.0,
            "category_slug": "local",
            "image_url": SAMPLE_IMAGES[4],
        },
        {
            "title": "Posters (Local)",
            "description": "Custom large-format posters printed locally.",
            "price": 30.0,
            "category_slug": "local",
            "image_url": SAMPLE_IMAGES[5],
        },
        {
            "title": "Flyers (Local)",
            "description": "Quick-turn flyers for local pickup/delivery.",
            "price": 20.0,
            "category_slug": "local",
            "image_url": SAMPLE_IMAGES[3],
        },
    ]
    prod_count = await db.products.count_documents({})
    if prod_count == 0:
        docs = []
        for sp in sample_products:
            p = Product(**sp)
            docs.append(await serialize_datetime(p.model_dump()))
        await db.products.insert_many(docs)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def on_startup():
    await seed_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from app.backend.db.connection import Base, engine, SessionLocal
from app.backend.models.product_model import Product

async def seed_products():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if not db.query(Product).first():
        demo_products = [
            Product(name="Laptop", description="A fast laptop", price=999.99),
            Product(name="Mouse", description="Wireless mouse", price=25.50),
            Product(name="Keyboard", description="Mechanical keyboard", price=80.00)
        ]
        db.add_all(demo_products)
        db.commit()
    db.close()

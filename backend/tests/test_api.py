from fastapi.testclient import TestClient
from app.backend.server import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Welcome to the Product API"

def test_get_products():
    response = client.get("/api/products/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

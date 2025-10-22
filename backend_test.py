import requests
import sys
import json
from datetime import datetime

class EnPixelsAPITester:
    def __init__(self, base_url="https://digital-studio-shop.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, expected_data_checks=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            # Additional data validation checks
            if success and expected_data_checks:
                for check_name, check_func in expected_data_checks.items():
                    try:
                        check_result = check_func(response_data)
                        if not check_result:
                            success = False
                            print(f"❌ Data validation failed: {check_name}")
                        else:
                            print(f"✅ Data validation passed: {check_name}")
                    except Exception as e:
                        success = False
                        print(f"❌ Data validation error for {check_name}: {str(e)}")

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"test": name, "status": "PASSED", "response_code": response.status_code})
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                self.test_results.append({"test": name, "status": "FAILED", "response_code": response.status_code, "error": response.text[:200]})

            return success, response_data

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"test": name, "status": "ERROR", "error": str(e)})
            return False, {}

    def test_hello_world(self):
        """Test GET /api/ returns Hello World"""
        return self.run_test(
            "Hello World Endpoint",
            "GET",
            "",
            200,
            expected_data_checks={
                "has_message": lambda data: "message" in data,
                "correct_message": lambda data: data.get("message") == "Hello World"
            }
        )

    def test_categories(self):
        """Test GET /api/categories returns 3 categories"""
        return self.run_test(
            "Categories Endpoint",
            "GET",
            "categories",
            200,
            expected_data_checks={
                "is_list": lambda data: isinstance(data, list),
                "has_3_categories": lambda data: len(data) == 3,
                "has_required_slugs": lambda data: set(item.get("slug") for item in data) == {"digital", "prints", "local"},
                "categories_have_names": lambda data: all("name" in item and "slug" in item for item in data)
            }
        )

    def test_products(self):
        """Test GET /api/products returns >= 9 seeded products"""
        return self.run_test(
            "Products Endpoint",
            "GET",
            "products",
            200,
            expected_data_checks={
                "is_list": lambda data: isinstance(data, list),
                "has_min_9_products": lambda data: len(data) >= 9,
                "products_have_required_fields": lambda data: all(
                    all(field in item for field in ["id", "title", "description", "price", "category_slug"])
                    for item in data
                ),
                "valid_category_slugs": lambda data: all(
                    item.get("category_slug") in ["digital", "prints", "local"] for item in data
                )
            }
        )

    def test_products_category_filter(self):
        """Test GET /api/products with category filter"""
        success_digital, data_digital = self.run_test(
            "Products Digital Filter",
            "GET",
            "products?category=digital",
            200,
            expected_data_checks={
                "is_list": lambda data: isinstance(data, list),
                "all_digital": lambda data: all(item.get("category_slug") == "digital" for item in data),
                "has_products": lambda data: len(data) > 0
            }
        )

        success_prints, data_prints = self.run_test(
            "Products Prints Filter",
            "GET",
            "products?category=prints",
            200,
            expected_data_checks={
                "is_list": lambda data: isinstance(data, list),
                "all_prints": lambda data: all(item.get("category_slug") == "prints" for item in data),
                "has_products": lambda data: len(data) > 0
            }
        )

        success_local, data_local = self.run_test(
            "Products Local Filter",
            "GET",
            "products?category=local",
            200,
            expected_data_checks={
                "is_list": lambda data: isinstance(data, list),
                "all_local": lambda data: all(item.get("category_slug") == "local" for item in data),
                "has_products": lambda data: len(data) > 0
            }
        )

        return success_digital and success_prints and success_local, {
            "digital": data_digital,
            "prints": data_prints,
            "local": data_local
        }

    def test_create_order(self):
        """Test POST /api/orders creates order with proper calculations"""
        # First get a product to use in the order
        success, products_data = self.run_test("Get Products for Order", "GET", "products?limit=1", 200)
        if not success or not products_data:
            print("❌ Cannot test order creation - no products available")
            return False, {}

        product = products_data[0]
        
        # Test order creation with digital product (no delivery fee)
        order_data = {
            "email": "test@example.com",
            "name": "Test User",
            "notes": "Test order",
            "delivery_method": "digital",
            "items": [{"product_id": product["id"], "quantity": 2}]
        }

        success, response = self.run_test(
            "Create Order - Digital",
            "POST",
            "orders",
            200,
            data=order_data,
            expected_data_checks={
                "has_id": lambda data: "id" in data,
                "correct_email": lambda data: data.get("email") == "test@example.com",
                "correct_name": lambda data: data.get("name") == "Test User",
                "correct_status": lambda data: data.get("status") == "created",
                "has_subtotal": lambda data: "subtotal" in data and isinstance(data["subtotal"], (int, float)),
                "has_delivery_fee": lambda data: "delivery_fee" in data and isinstance(data["delivery_fee"], (int, float)),
                "has_total": lambda data: "total" in data and isinstance(data["total"], (int, float)),
                "correct_calculation": lambda data: abs(data.get("total", 0) - (data.get("subtotal", 0) + data.get("delivery_fee", 0))) < 0.01
            }
        )

        return success, response

    def test_create_order_with_delivery(self):
        """Test POST /api/orders with delivery method and physical items"""
        # Get a physical product (prints or local)
        success, products_data = self.run_test("Get Physical Products", "GET", "products?category=prints&limit=1", 200)
        if not success or not products_data:
            print("❌ Cannot test delivery order - no physical products available")
            return False, {}

        product = products_data[0]
        
        order_data = {
            "email": "test@example.com",
            "name": "Test User",
            "delivery_method": "delivery",
            "address": {
                "line1": "123 Test St",
                "city": "Test City",
                "state": "TS",
                "postal_code": "12345"
            },
            "items": [{"product_id": product["id"], "quantity": 1}]
        }

        return self.run_test(
            "Create Order - Delivery with Physical Item",
            "POST",
            "orders",
            200,
            data=order_data,
            expected_data_checks={
                "has_delivery_fee": lambda data: data.get("delivery_fee") == 7.0,
                "correct_delivery_method": lambda data: data.get("delivery_method") == "delivery",
                "has_address": lambda data: data.get("address") is not None
            }
        )

    def test_checkout_session(self):
        """Test POST /api/checkout/session creates session and updates order status"""
        # First create an order
        success, order_data = self.test_create_order()
        if not success:
            print("❌ Cannot test checkout session - order creation failed")
            return False, {}

        order_id = order_data.get("id")
        if not order_id:
            print("❌ Cannot test checkout session - no order ID")
            return False, {}

        # Create checkout session
        session_data = {"order_id": order_id}
        success, response = self.run_test(
            "Create Checkout Session",
            "POST",
            "checkout/session",
            200,
            data=session_data,
            expected_data_checks={
                "has_checkout_url": lambda data: "checkout_url" in data and data["checkout_url"].startswith("https://"),
                "correct_order_id": lambda data: data.get("order_id") == order_id,
                "has_payment_provider": lambda data: data.get("payment_provider") == "mock"
            }
        )

        return success, response

    def test_get_order(self):
        """Test GET /api/orders/{id} retrieves created order"""
        # First create an order
        success, order_data = self.test_create_order()
        if not success:
            print("❌ Cannot test get order - order creation failed")
            return False, {}

        order_id = order_data.get("id")
        if not order_id:
            print("❌ Cannot test get order - no order ID")
            return False, {}

        return self.run_test(
            "Get Order by ID",
            "GET",
            f"orders/{order_id}",
            200,
            expected_data_checks={
                "correct_id": lambda data: data.get("id") == order_id,
                "has_required_fields": lambda data: all(
                    field in data for field in ["email", "name", "items", "subtotal", "total", "status"]
                )
            }
        )

def main():
    print("🚀 Starting En Pixels E-commerce API Tests")
    print("=" * 50)
    
    tester = EnPixelsAPITester()
    
    # Run all tests
    print("\n📋 Running Backend API Tests...")
    
    # Basic endpoint tests
    tester.test_hello_world()
    tester.test_categories()
    tester.test_products()
    tester.test_products_category_filter()
    
    # Order workflow tests
    tester.test_create_order()
    tester.test_create_order_with_delivery()
    tester.test_checkout_session()
    tester.test_get_order()
    
    # Print final results
    print(f"\n📊 Test Results Summary")
    print("=" * 30)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Print detailed results
    print(f"\n📋 Detailed Results:")
    for result in tester.test_results:
        status_emoji = "✅" if result["status"] == "PASSED" else "❌"
        print(f"{status_emoji} {result['test']}: {result['status']}")
        if result["status"] != "PASSED" and "error" in result:
            print(f"   Error: {result['error']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
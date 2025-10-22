import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

export const ProductCard = ({ product }) => {
  const { add } = useCart();
  return (
    <Card className="group overflow-hidden border hover:shadow-md transition-shadow" data-testid={`product-card-${product.id}`}>
      <Link to={`/product/${product.id}`} className="block" data-testid="product-card-link">
        <div className="aspect-[4/3] overflow-hidden bg-gray-50">
          <img src={product.image_url} alt={product.title} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform" />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link to={`/product/${product.id}`} className="hover:underline" data-testid="product-card-title-link">
              <h3 className="font-semibold" data-testid="product-title">{product.title}</h3>
            </Link>
            <p className="text-xs text-gray-500 mt-1" data-testid="product-category">{product.category_slug}</p>
          </div>
          <span className="font-bold" data-testid="product-price">${product.price.toFixed(2)}</span>
        </div>
        <Button className="mt-4 rounded-full" style={{background:'#111', color:'#fff'}} onClick={() => add(product, 1)} data-testid="add-to-cart-button">Add to Cart</Button>
      </div>
    </Card>
  );
};

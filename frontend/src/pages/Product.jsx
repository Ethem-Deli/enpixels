import { Layout } from "@/components/Layout";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Product(){
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { add } = useCart();

  useEffect(()=>{
    axios.get(`${API}/products/${id}`).then(r=> setProduct(r.data)).catch(()=>{});
  },[id]);

  if (!product) return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-10" data-testid="product-loading">Loading…</div>
    </Layout>
  );

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-2 gap-10">
        <div className="rounded-xl overflow-hidden border">
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="product-detail-title">{product.title}</h1>
          <div className="mt-2 text-gray-600" data-testid="product-detail-category">{product.category_slug}</div>
          <div className="mt-4 text-2xl font-semibold" data-testid="product-detail-price">${product.price.toFixed(2)}</div>
          <p className="mt-4 text-gray-700" data-testid="product-detail-desc">{product.description}</p>
          <Button className="mt-6 rounded-full" style={{background:'#d4af37', color:'#111'}} onClick={()=>add(product,1)} data-testid="product-detail-add">Add to Cart</Button>
        </div>
      </div>
    </Layout>
  );
}

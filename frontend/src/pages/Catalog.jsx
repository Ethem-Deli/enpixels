import { Layout } from "@/components/Layout";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Catalog(){
  const [params] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(()=>{
    setLoading(true); setError(null);
    const category = params.get('category');
    const q = params.get('q');
    const url = new URL(`${API}/products`);
    if (category) url.searchParams.set('category', category);
    if (q) url.searchParams.set('q', q);
    axios.get(url.toString()).then(r=> setProducts(r.data)).catch(e=> setError('Failed to load')).finally(()=> setLoading(false));
  },[params]);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="catalog-title">Catalog</h1>
            <p className="text-gray-600" data-testid="catalog-subtitle">Explore digital downloads, fine prints, and local services.</p>
          </div>
          <Link to="/" className="text-sm underline" data-testid="catalog-back-home">Back to Home</Link>
        </div>
        {loading && <div className="mt-6 text-gray-500" data-testid="catalog-loading">Loading…</div>}
        {error && <div className="mt-6 text-red-600" data-testid="catalog-error">{error}</div>}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </Layout>
  );
}

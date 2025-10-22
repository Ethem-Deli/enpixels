import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Home(){
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const res = await axios.get(`${API}/products?limit=8`);
        setFeatured(res.data);
      }catch(e){ console.error(e); }
      finally{ setLoading(false); }
    })();
  },[]);

  return (
    <Layout>
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight" style={{fontFamily:"Manrope, Inter"}} data-testid="hero-title">Modern assets. Premium prints.</h1>
            <p className="mt-4 text-gray-600" data-testid="hero-subtitle">En Pixels is a creative digital studio offering sleek templates, graphics, and gallery-grade prints. Minimal, secure, and built for professionals.</p>
            <div className="mt-6 flex gap-3">
              <Link to="/catalog?category=digital" data-testid="cta-shop-digital"><Button className="rounded-full px-6" style={{background:'#d4af37', color:'#111'}}>Shop Digital</Button></Link>
              <Link to="/catalog?category=prints" data-testid="cta-shop-prints"><Button variant="outline" className="rounded-full px-6">Shop Prints</Button></Link>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border shadow-sm">
            <img src="https://images.unsplash.com/photo-1667912100232-a457b313ec18?auto=format&fit=crop&w=1600&q=80" alt="Studio hero" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-4">
        <h2 className="text-xl font-semibold" data-testid="categories-heading">Browse Categories</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/catalog?category=digital" className="group relative overflow-hidden rounded-xl border" data-testid="category-digital">
            <img src="https://images.unsplash.com/photo-1745173039229-416e2e6462d4?auto=format&fit=crop&w=1200&q=80" alt="Digital" className="h-40 w-full object-cover group-hover:scale-[1.03] transition-transform"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <span className="absolute bottom-3 left-3 text-white font-semibold">Digital Downloads</span>
          </Link>
          <Link to="/catalog?category=prints" className="group relative overflow-hidden rounded-xl border" data-testid="category-prints">
            <img src="https://images.unsplash.com/photo-1696787717706-d9d9fc9313fe?auto=format&fit=crop&w=1200&q=80" alt="Prints" className="h-40 w-full object-cover group-hover:scale-[1.03] transition-transform"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <span className="absolute bottom-3 left-3 text-white font-semibold">Prints</span>
          </Link>
          <Link to="/catalog?category=local" className="group relative overflow-hidden rounded-xl border" data-testid="category-local">
            <img src="https://images.unsplash.com/photo-1669975103315-42edfecb6632?auto=format&fit=crop&w=1200&q=80" alt="Local" className="h-40 w-full object-cover group-hover:scale-[1.03] transition-transform"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <span className="absolute bottom-3 left-3 text-white font-semibold">Local Orders</span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-12">
        <h2 className="text-xl font-semibold" data-testid="featured-heading">Featured</h2>
        {loading ? (
          <div className="text-gray-500 mt-4" data-testid="featured-loading">Loading…</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(p => (<ProductCard key={p.id} product={p} />))}
          </div>
        )}
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 mt-16">
        <h2 className="text-xl font-semibold" data-testid="about-heading">About En Pixels</h2>
        <p className="mt-3 text-gray-600" data-testid="about-text">We craft design assets and prints with a focus on clarity and trust. Every purchase is processed securely, and digital downloads are delivered instantly after payment.</p>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 mt-12 mb-16">
        <h2 className="text-xl font-semibold" data-testid="contact-heading">Contact</h2>
        <p className="mt-3 text-gray-600" data-testid="contact-text">For custom projects or local print inquiries, email <a href="mailto:hello@enpixels.studio" className="underline" data-testid="contact-email">hello@enpixels.studio</a>.</p>
      </section>
    </Layout>
  );
}

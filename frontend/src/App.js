import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import Product from "@/pages/Product";
import Checkout from "@/pages/Checkout";
import Success from "@/pages/Success";
import { CartProvider } from "@/context/CartContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  useEffect(() => {
    axios.get(`${API}/`).catch(()=>{});
  }, []);

  return (
    <div>
      <BrowserRouter>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<Success />} />
          </Routes>
        </CartProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

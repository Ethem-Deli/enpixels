import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartCtx = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart-items')||'[]'); } catch { return []; }
  });

  useEffect(()=>{ localStorage.setItem('cart-items', JSON.stringify(items)); }, [items]);

  const add = (product, qty=1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id);
      if (idx > -1) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], quantity: clone[idx].quantity + qty };
        return clone;
      }
      return [...prev, { product, quantity: qty }];
    });
  };
  const remove = (pid) => setItems(prev => prev.filter(i => i.product.id !== pid));
  const update = (pid, qty) => setItems(prev => prev.map(i => i.product.id===pid?{...i, quantity: qty}:i));
  const clear = () => setItems([]);

  const count = useMemo(()=> items.reduce((a,b)=>a+b.quantity,0), [items]);
  const subtotal = useMemo(()=> items.reduce((a,b)=> a + (b.product.price*b.quantity), 0), [items]);

  const value = { items, add, remove, update, clear, count, subtotal };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('CartProvider missing');
  return ctx;
};

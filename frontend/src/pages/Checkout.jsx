import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/context/CartContext";
import axios from "axios";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Checkout(){
  const { items, subtotal, clear } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState(items.some(i=>["prints","local"].includes(i.product.category_slug))?"pickup":"digital");
  const [address, setAddress] = useState({ line1:"", city:"", state:"", postal_code:"" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const deliveryFee = useMemo(()=> deliveryMethod === 'delivery' && items.some(i=>["prints","local"].includes(i.product.category_slug)) ? 7 : 0, [deliveryMethod, items]);
  const total = useMemo(()=> (subtotal + deliveryFee).toFixed(2), [subtotal, deliveryFee]);

  const placeOrder = async () => {
    setLoading(true);
    try{
      const payload = {
        email, name, notes,
        delivery_method: deliveryMethod,
        address: deliveryMethod==='delivery'?address:null,
        items: items.map(i=>({ product_id: i.product.id, quantity: i.quantity }))
      };
      const orderRes = await axios.post(`${API}/orders`, payload);
      const sessionRes = await axios.post(`${API}/checkout/session`, { order_id: orderRes.data.id });
      clear();
      navigate(`/success?order=${orderRes.data.id}`);
      window.open(sessionRes.data.checkout_url, '_blank');
    }catch(e){ console.error(e); alert('Checkout failed. Please try again.'); }
    finally{ setLoading(false); }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-2 gap-10">
        <div>
          <h1 className="text-3xl font-bold" data-testid="checkout-title">Checkout</h1>
          <div className="mt-6 space-y-4">
            <Input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} data-testid="checkout-name" />
            <Input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} data-testid="checkout-email" />
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger data-testid="checkout-delivery-method"><SelectValue placeholder="Delivery method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="digital" data-testid="delivery-digital">Digital (downloads)</SelectItem>
                <SelectItem value="pickup" data-testid="delivery-pickup">Pickup</SelectItem>
                <SelectItem value="delivery" data-testid="delivery-delivery">Delivery (flat $7)</SelectItem>
              </SelectContent>
            </Select>
            {deliveryMethod==='delivery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="address-fields">
                <Input placeholder="Address line" value={address.line1} onChange={e=>setAddress({...address, line1:e.target.value})} data-testid="address-line1" />
                <Input placeholder="City" value={address.city} onChange={e=>setAddress({...address, city:e.target.value})} data-testid="address-city" />
                <Input placeholder="State" value={address.state} onChange={e=>setAddress({...address, state:e.target.value})} data-testid="address-state" />
                <Input placeholder="Postal code" value={address.postal_code} onChange={e=>setAddress({...address, postal_code:e.target.value})} data-testid="address-postal" />
              </div>
            )}
            <Textarea placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} data-testid="checkout-notes" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold" data-testid="order-summary-title">Order Summary</h2>
          <div className="mt-4 space-y-3">
            {items.map(i=> (
              <div key={i.product.id} className="flex items-center gap-3 border rounded-lg p-3" data-testid="summary-item">
                <img src={i.product.image_url} alt={i.product.title} className="h-14 w-14 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-medium">{i.product.title}</div>
                  <div className="text-xs text-gray-500">Qty {i.quantity}</div>
                </div>
                <div className="font-semibold">${(i.product.price*i.quantity).toFixed(2)}</div>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-2">
              <span>Subtotal</span><span data-testid="summary-subtotal">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Delivery</span><span data-testid="summary-delivery">${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold border-t pt-3">
              <span>Total</span><span data-testid="summary-total">${total}</span>
            </div>
            <Button className="w-full rounded-full mt-4" style={{background:'#d4af37', color:'#111'}} onClick={placeOrder} disabled={loading || items.length===0 || !name || !email} data-testid="place-order-button">{loading? 'Processing…' : 'Place Secure Order'}</Button>
            <div className="text-xs text-gray-500 text-center" data-testid="secure-note">Secure checkout (mocked for demo)</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

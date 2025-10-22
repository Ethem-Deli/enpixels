import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useSearchParams, Link } from "react-router-dom";

export default function Success(){
  const [params] = useSearchParams();
  const orderId = params.get('order');
  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold" data-testid="success-title">Thank you!</h1>
        <p className="mt-3 text-gray-600" data-testid="success-text">Your order was created successfully. You'll receive an email once payment is confirmed.</p>
        <div className="mt-4 text-sm" data-testid="success-order-id">Order ID: <span className="font-mono">{orderId}</span></div>
        <Link to="/catalog"><Button className="mt-8 rounded-full" style={{background:'#111', color:'#fff'}} data-testid="success-continue">Continue Shopping</Button></Link>
      </div>
    </Layout>
  );
}

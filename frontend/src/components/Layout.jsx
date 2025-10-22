import { Link, NavLink } from "react-router-dom";
import { ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";

export const Layout = ({ children }) => {
  const { count } = useCart();
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-2" data-testid="nav-logo">
            <span className="text-2xl font-bold tracking-tight" style={{fontFamily:"Manrope, Inter"}}>En Pixels</span>
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{backgroundColor:'#f5efe0', color:'#7a5b00'}} data-testid="nav-badge">Studio</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" className="hover:opacity-80" data-testid="nav-home">Home</NavLink>
            <NavLink to="/catalog" className="hover:opacity-80" data-testid="nav-catalog">Catalog</NavLink>
            <a href="#about" className="hover:opacity-80" data-testid="nav-about">About</a>
            <a href="#contact" className="hover:opacity-80" data-testid="nav-contact">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/checkout" data-testid="nav-cart">
              <Button variant="outline" className="relative rounded-full">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-2 -top-2 rounded-full px-2 text-xs font-bold" style={{background:'#d4af37', color:'#111'}} data-testid="cart-count">{count}</span>
              </Button>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" data-testid="nav-menu"><Menu className="h-6 w-6"/></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  <NavLink to="/" data-testid="drawer-home">Home</NavLink>
                  <NavLink to="/catalog" data-testid="drawer-catalog">Catalog</NavLink>
                  <a href="#about" data-testid="drawer-about">About</a>
                  <a href="#contact" data-testid="drawer-contact">Contact</a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t mt-14">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-600 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span data-testid="footer-brand">© {new Date().getFullYear()} En Pixels Studio</span>
          <span data-testid="footer-note">Minimal design assets & premium prints. Secure checkout.</span>
        </div>
      </footer>
    </div>
  );
};

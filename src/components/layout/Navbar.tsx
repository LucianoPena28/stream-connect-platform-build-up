import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/CartDrawer';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-primary/90 backdrop-blur-md shadow-sm">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🟡</span>
          <div>
            <h1 className="text-lg font-display font-extrabold text-primary-foreground leading-tight">StreamHub</h1>
            <p className="text-xs text-primary-foreground/70 hidden sm:block">Affordable streaming & music</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-semibold transition-colors hover:text-primary-foreground/80 ${
                location.pathname === link.to ? 'text-primary-foreground underline underline-offset-4' : 'text-primary-foreground/90'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <CartDrawer />
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <CartDrawer />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-primary-foreground">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden bg-primary border-t border-primary-foreground/10 px-4 py-3 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-semibold text-primary-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

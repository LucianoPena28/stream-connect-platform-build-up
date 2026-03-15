import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/CartDrawer';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.jpg';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="sticky top-0 z-50 bg-primary/90 backdrop-blur-md shadow-sm">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Stream Connect logo" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <h1 className="text-lg font-display font-extrabold text-primary-foreground leading-tight">Stream Connect</h1>
            <p className="text-xs text-primary-foreground/70 hidden sm:block">Your Digital Services Hub</p>
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
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-primary-foreground hover:text-primary-foreground/80">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Link to={user ? '/account' : '/account/login'}>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-primary-foreground/80">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <CartDrawer />
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-primary-foreground">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
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
          <Link
            to={user ? '/account' : '/account/login'}
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-semibold text-primary-foreground"
          >
            {user ? 'My Account' : 'Sign In'}
          </Link>
        </nav>
      )}
    </header>
  );
}

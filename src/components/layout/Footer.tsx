import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground py-10">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display font-bold text-lg mb-2">Stream Connect</h3>
            <p className="text-sm text-sidebar-foreground/70">Affordable Streaming & Music subscriptions in Belize.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Quick Links</h4>
            <div className="space-y-1 text-sm text-sidebar-foreground/70">
              <Link to="/" className="block hover:text-sidebar-foreground">Home</Link>
              <Link to="/services" className="block hover:text-sidebar-foreground">Services</Link>
              <Link to="/contact" className="block hover:text-sidebar-foreground">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Contact</h4>
            <p className="text-sm text-sidebar-foreground/70">WhatsApp: +501 613-9834</p>
            <p className="text-sm text-sidebar-foreground/70">Email: support@streamconnect.online</p>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-sidebar-border text-center text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Stream Connect. Streaming brands belong to their respective owners.
        </div>
      </div>
    </footer>
  );
}

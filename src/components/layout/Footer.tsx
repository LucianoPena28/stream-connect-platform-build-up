import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-10">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display font-bold text-lg mb-2">StreamHub Services</h3>
            <p className="text-sm text-background/70">Affordable streaming & music subscriptions in Belize.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Quick Links</h4>
            <div className="space-y-1 text-sm text-background/70">
              <Link to="/" className="block hover:text-background">Home</Link>
              <Link to="/services" className="block hover:text-background">Services</Link>
              <Link to="/contact" className="block hover:text-background">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Contact</h4>
            <p className="text-sm text-background/70">WhatsApp: +501 6XX-XXXX</p>
            <p className="text-sm text-background/70">Email: luciano.pena@streamhub.bz</p>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-background/20 text-center text-xs text-background/50">
          © {new Date().getFullYear()} StreamHub Services. Streaming brands belong to their respective owners.
        </div>
      </div>
    </footer>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { useCartSync } from "@/hooks/useCartSync";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { AdminLayout } from "@/components/layout/AdminLayout";

import Index from "./pages/Index";
import Services from "./pages/Services";
import ProductDetail from "./pages/ProductDetail";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminCustomers from "./pages/admin/Customers";
import AdminTickets from "./pages/admin/Tickets";
import AdminEmployees from "./pages/admin/Employees";
import AdminServicesManagement from "./pages/admin/ServicesManagement";
import AdminApiConnections from "./pages/admin/ApiConnections";
import AdminSettings from "./pages/admin/Settings";
import AccountLogin from "./pages/account/Login";
import AccountRegister from "./pages/account/Register";
import AccountDashboard from "./pages/account/Dashboard";
import AccountSecurity from "./pages/account/Security";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  useCartSync();

  return (
    <BrowserRouter>
      <Routes>
        {/* Customer-facing routes */}
        <Route path="/" element={<><Navbar /><Index /><Footer /><ChatbotWidget /></>} />
        <Route path="/services" element={<><Navbar /><Services /><Footer /><ChatbotWidget /></>} />
        <Route path="/product/:handle" element={<><Navbar /><ProductDetail /><Footer /><ChatbotWidget /></>} />
        <Route path="/contact" element={<><Navbar /><Contact /><Footer /><ChatbotWidget /></>} />
        <Route path="/checkout" element={<><Navbar /><Checkout /><Footer /></>} />

        {/* Customer account routes */}
        <Route path="/account/login" element={<><Navbar /><AccountLogin /><Footer /></>} />
        <Route path="/account/register" element={<><Navbar /><AccountRegister /><Footer /></>} />
        <Route path="/account" element={<><Navbar /><AccountDashboard /><Footer /></>} />
        <Route path="/account/security" element={<><Navbar /><AccountSecurity /><Footer /></>} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
        <Route path="/admin/customers" element={<AdminLayout><AdminCustomers /></AdminLayout>} />
        <Route path="/admin/tickets" element={<AdminLayout><AdminTickets /></AdminLayout>} />
        <Route path="/admin/employees" element={<AdminLayout><AdminEmployees /></AdminLayout>} />
        <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

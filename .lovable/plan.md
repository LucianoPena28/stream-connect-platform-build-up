

# StreamHub Services — Full-Stack Web App

## Overview
A complete subscription services platform for your Belize-based business, featuring a customer-facing storefront with your signature Snapchat-yellow branding and an internal admin dashboard for your small team. Built on React + Supabase (Lovable Cloud) with Shopify for checkout.

---

## Phase 1: Foundation & Database

### Lovable Cloud Setup
- Enable Lovable Cloud for database, auth, edge functions, and storage
- Set up the database schema: **Users, Profiles, User Roles, Customers, Services/Plans, Orders, Order Items, Tickets/Messages, Chat Sessions**
- Configure authentication (email/password) for admin team access
- Role-based access: **admin** and **support** roles for your small team

### Shopify Integration
- Create a new Shopify development store through Lovable
- Sync Netflix & Spotify plans as Shopify products
- Wire up checkout to redirect to Shopify's hosted checkout

---

## Phase 2: Customer-Facing Site

### Homepage / Landing Page
- **Snapchat-yellow branded hero** with your flyer content directly ported in:
  - "Netflix accounts available: $10 BZD per profile or $30 BZD for all 4 monthly"
  - "Spotify Individual: $20 BZD or Family: $30 BZD monthly"
  - "Hit me up for a quote on any other app"
- "Who We Are" section explaining your digital subscription business
- "Why Choose Us" feature cards (trust, local payments, support)
- Prominent CTAs: **View Plans** and **Message Us**

### Services / Plans Page
- Service cards with brand-aligned colors:
  - 🔴 **Netflix** cards (per-profile $10, all-4 $30) in Netflix red
  - 🟢 **Spotify** cards (Individual $20, Family $30) in Spotify green
  - 📱 **Custom App** — "Request a quote" card
- Each card has price, description, and **Add to Cart** button
- Placeholder components with comments for official Netflix/Spotify brand assets

### Cart & Checkout
- Slide-out cart panel showing items, prices (BZD), quantities, and monthly total
- Remove/update items
- **Checkout flow** collects: name, email, phone, preferred contact method
- **Payment method selection:**
  - **Shopify Checkout** → redirects to Shopify's secure hosted checkout
  - **e-Kyash** → shows payment instructions, records order as "Pending Payment"
  - **DigiWallet** → shows payment instructions, records order as "Pending Payment"
  - **Bank Transfer** → shows account details, records order as "Pending Payment"
- All orders saved to database regardless of payment method

### Contact & Communication
- Contact form (Name, Email, Subject, Message) → saves as ticket in database
- **WhatsApp button** → opens pre-filled WhatsApp chat (configurable number)
- **Email link** → mailto with configurable support address
- Input validation with success/error feedback

### AI Chatbot Widget
- Floating chat bubble on all customer pages
- Chat UI with message history and typing indicator
- Powered by **Lovable AI** (Gemini model) via edge function
- Knows about your Netflix/Spotify plans, pricing, how to order, FAQs
- Conversations logged to database and linked to customer sessions

### Account / Orders Page
- Customer can view their order history and status
- Download PDF receipt for completed orders

---

## Phase 3: Admin Dashboard (CRM)

### Authentication & Access
- Email/password login for team members
- Role-based access control (admin, support)
- Protected routes — only authenticated team members can access

### Overview Dashboard
- **KPI cards:** total orders, monthly revenue (BZD), active subscriptions, open tickets
- Recent orders list
- Recent contact messages

### Orders Management
- Filterable order list (date range, payment method, status)
- Order detail view: customer info, line items, pricing, payment method/status
- Update order status: Pending → Paid → Active → Cancelled
- Internal notes per order
- **Download PDF receipt** button

### Customer Management
- Customer list with search
- Customer detail: order history, messages/tickets, WhatsApp/email metadata
- Add internal notes

### Tickets / Messages Inbox
- Unified inbox: contact form submissions + chatbot conversations needing follow-up
- Filter by open/closed status
- "Respond via email" action (stored in DB, with note to hook in real email provider later)

### AI Integrations Panel
- Status display for AI provider configuration
- Toggle "Use AI assistant for chat" on/off
- Documentation notes on how to customize the AI backend

### Settings / Integrations
- Configure: WhatsApp number, default message text, support email
- Shopify connection status and config
- Local payment instructions editor (e-Kyash, DigiWallet, bank transfer details)
- All secrets stored securely via Lovable Cloud secrets

---

## Phase 4: PDF Generation & Exports

- **Order receipt PDF** — downloadable from both customer and admin order views (items, prices in BZD, payment method)
- **Flyer PDF** — admin can generate a PDF version of current offers
- Generated server-side via edge function and streamed to browser

---

## Design & UX

- **Primary color:** Snapchat yellow (#FFFC00) background with high-contrast white/dark content cards
- **Brand accents:** Netflix red (#E50914), Spotify green (#1DB954)
- **Mobile-first responsive design** across all pages
- Clean, minimal layout with prominent CTAs
- Consistent component system (buttons, cards, forms, tables)
- Accessible: semantic HTML, keyboard navigation, focus states
- Google Material Icons via Lucide React equivalents

---

## Security & Best Practices

- Supabase Row-Level Security on all tables
- No raw card data stored — Shopify handles PCI-compliant payment processing
- Server-side input validation on all edge functions
- HTTPS enforced in deployment
- Role-based admin access with proper RLS policies
- Code comments documenting PCI responsibilities and integration points


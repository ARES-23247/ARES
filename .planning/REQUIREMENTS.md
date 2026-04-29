# Requirements

**Coverage:** 0 / 12 requirements satisfied

| REQ-ID | Description | Phase | Status |
|--------|-------------|-------|--------|
| STRIPE-01 | Stripe Secret Keys Configuration | 29 | [x] |
| STRIPE-02 | D1 E-Commerce Schema (products, orders) | 29 | [x] |
| STRIPE-03 | Fetch Active Inventory API | 30 | [x] |
| STRIPE-04 | Generate Stripe Checkout Session API | 30 | [x] |
| STRIPE-05 | Stripe Webhook Listener & Signature Verification | 30 | [x] |
| STORE-01 | Storefront UI Grid (ARES Brand) | 31 | [ ] |
| STORE-02 | Shopping Cart State (Multi-item) | 31 | [ ] |
| STORE-03 | Add/Remove Cart Items & Calculate Totals | 31 | [ ] |
| ADMIN-01 | Order Tracking Dashboard UI | 32 | [ ] |
| ADMIN-02 | Fulfill/Ship Order Toggle | 32 | [ ] |

## Detailed Requirements

### [x] STRIPE-01: Stripe Secret Keys Configuration
Configure Cloudflare bindings for `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- **[x] AC-1**: Keys are securely handled via Cloudflare environment variables and never exposed to the client.

### [x] STRIPE-02: D1 E-Commerce Schema
Create SQL tables to manage physical merchandise.
- **[x] AC-1**: `products` table tracks id, name, description, price, image_url, and active status.
- **[x] AC-2**: `orders` table tracks stripe_session_id, customer email, shipping address, total amount, and fulfillment status.

### [x] STRIPE-03: Fetch Active Inventory API
Create a `ts-rest` Hono endpoint `GET /api/store/products`.
- **[x] AC-1**: Selects all products where `active = 1`.
- **[x] AC-2**: Exposes id, name, description, price, and image.

### [x] STRIPE-04: Generate Stripe Checkout Session API
Create a `POST /api/store/checkout` endpoint.
- **[x] AC-1**: Accepts a list of product IDs and quantities.
- **[x] AC-2**: Cross-references product IDs against the D1 database to pull authentic prices (prevents client-side price spoofing).
- **[x] AC-3**: Generates a Stripe Checkout Session URL and returns it to the client.

### [x] STRIPE-05: Stripe Webhook Listener & Signature Verification
Create a raw Hono endpoint `POST /api/store/webhook` to listen to Stripe events.
- **[x] AC-1**: Validates `stripe-signature` using the official SDK.
- **[x] AC-2**: On `checkout.session.completed`, inserts a new row into the `orders` D1 table with the customer's email and shipping address and marks it as paid.

### [ ] STORE-01: Storefront UI Grid
Create `src/pages/Store.tsx` to display merchandise.
- **[ ] AC-1**: Fully responsive grid layout adhering to ARESFIRST brand standards.

### [ ] STORE-02: Shopping Cart State
Implement a client-side shopping cart.
- **[ ] AC-1**: Cart persists across page loads (using `zustand` with `persist` or `localStorage`).

### [ ] STORE-03: Add/Remove Cart Items & Calculate Totals
Cart UI functionality.
- **[ ] AC-1**: Users can add items, increment/decrement quantities, and remove items.
- **[ ] AC-2**: Cart modal/sidebar calculates the exact subtotal.

### [ ] ADMIN-01: Order Tracking Dashboard UI
Build an admin panel for tracking incoming physical orders.
- **[ ] AC-1**: Accessible only to roles with `admin` or specific `store_manager` privileges.
- **[ ] AC-2**: Displays a table of orders with their shipping addresses.

### [ ] ADMIN-02: Fulfill/Ship Order Toggle
Provide operations for order fulfillment.
- **[ ] AC-1**: Admins can mark an order as "Shipped" or "Fulfilled", updating the D1 table.

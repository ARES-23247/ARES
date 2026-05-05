import { Hono } from "hono";
import { createHonoEndpoints } from "ts-rest-hono";
import { storeContract } from "../../../shared/schemas/contracts/storeContract";
import { AppEnv, logSystemError, ensureAdmin, s } from "../middleware";
import Stripe from "stripe";
import { sendZulipMessage } from "../../utils/zulip";
import { Kysely } from "kysely";
import { DB } from "../../../shared/schemas/database";
import { RecursiveRouterObj } from "ts-rest-hono";

const app = new Hono<AppEnv>();

// CR-04 FIX: Apply ensureAdmin middleware to orders routes
app.use("/orders", ensureAdmin);
app.use("/orders/*", ensureAdmin);

const storeHandlers: RecursiveRouterObj<typeof storeContract, AppEnv> = {
  getProducts: async (_input, c) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const products = await db
        .selectFrom("products")
        .selectAll()
        .where("active", "=", 1)
        .execute();

      return {
        status: 200,
        body: products.map((p) => ({
          id: p.id || "",
          name: p.name || "Unknown Product",
          description: p.description || null,
          price_cents: p.price_cents || 0,
          image_url: p.image_url || null,
          active: p.active || 1,
          stock_count: p.stock_count ?? null,
          created_at: p.created_at || null,
        })),
      };
    } catch (err: any) {
      console.error("[Store] Get products failed:", err);
      return { status: 500, body: { error: err.message } };
    }
  },
  createCheckoutSession: async ({ body }, c) => {
    try {
      const { items, successUrl, cancelUrl } = body;
      const stripeKey = c.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured.");
      }

      // @ts-expect-error - Stripe typings mismatch
      const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
      const db = c.get("db") as Kysely<DB>;

      // Fetch product details
      const productIds = items.map((i: any) => i.productId);
      const products = await db
        .selectFrom("products")
        .selectAll()
        .where("id", "in", productIds)
        .where("active", "=", 1)
        .execute();

      const productMap = new Map(products.map((p) => [p.id, p]));

      const lineItems = items.map((item: any) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found or inactive.`);
        }
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              images: product.image_url ? [product.image_url] : [],
            },
            unit_amount: product.price_cents,
          },
          quantity: item.quantity,
        };
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        metadata: {
          cartItems: JSON.stringify(items.map((i: any) => ({ id: i.productId, q: i.quantity })))
        },
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        shipping_address_collection: {
          allowed_countries: ["US", "CA"],
        },
      });

      if (!session.url) {
        throw new Error("Stripe session URL is null");
      }

      return {
        status: 200,
        body: {
          sessionId: session.id,
          url: session.url,
        },
      };
    } catch (err: any) {
      console.error("[Store] Checkout failed:", err);
      return { status: 500, body: { error: err.message } };
    }
  },
  handleWebhook: async ({ body, headers }, c) => {
    try {
      const stripeKey = c.env.STRIPE_SECRET_KEY;
      const endpointSecret = c.env.STRIPE_WEBHOOK_SECRET;
      const signature = headers["stripe-signature"];

      if (!stripeKey || !endpointSecret || !signature) {
        return { status: 400, body: { error: "Missing stripe config or signature" } };
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          JSON.stringify(body),
          signature,
          endpointSecret
        );
      } catch (err: any) {
        console.error(`[Webhook] Signature verification failed: ${err.message}`);
        return { status: 400, body: { error: `Webhook Error: ${err.message}` } };
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const db = c.get("db") as Kysely<DB>;

        // Fulfill order
        const metadata = session.metadata;
        const cartItems = metadata?.cartItems ? JSON.parse(metadata.cartItems) : [];

        await db
          .insertInto("orders")
          .values({
            id: session.id,
            stripe_session_id: session.id,
            customer_email: session.customer_details?.email || "unknown",
            total_cents: session.amount_total || 0,
            status: "paid",
            items_json: JSON.stringify(cartItems),
            created_at: new Date().toISOString(),
          })
          .execute();

        // Deplete inventory
        for (const item of cartItems) {
          await db
            .updateTable("products")
            .set((eb) => ({ stock_count: eb("stock_count", "-", item.q) }))
            .where("id", "=", item.id)
            .where("stock_count", "is not", null)
            .execute();
        }

        // Alert team
        const totalAmount = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";
        const customerEmail = session.customer_details?.email || "Unknown Email";
        const message = `🛍️ **New Order Received!**\n\n**Order ID**: ${session.id}\n**Customer**: ${customerEmail}\n**Total**: $${totalAmount}\n\n[View Dashboard](https://aresweb.org/admin)`;
        await sendZulipMessage(c.env, "general", "Store Orders", message);
      }

      return { status: 200, body: { success: true } };
    } catch (err: any) {
      logSystemError(c, "webhook_error", err);
      return { status: 500, body: { error: "Webhook fulfillment failed" } };
    }
  },
  getOrders: async (_input, c) => {
    try {
      await ensureAdmin(c);
      const db = c.get("db") as Kysely<DB>;
      const orders = await db.selectFrom("orders").selectAll().orderBy("created_at", "desc").execute();
      return { status: 200, body: { orders: orders as any } };
    } catch (err: any) {
      return { status: 500, body: { error: err.message } };
    }
  },
  updateOrderStatus: async ({ params, body }, c) => {
    try {
      await ensureAdmin(c);
      const db = c.get("db") as Kysely<DB>;
      await db.updateTable("orders").set({ status: body.status }).where("id", "=", params.id).execute();
      return { status: 200, body: { success: true } };
    } catch (err: any) {
      return { status: 500, body: { error: err.message } };
    }
  },
};

const storeTsRestRouter = s.router(storeContract, storeHandlers);

createHonoEndpoints(
  storeContract,
  storeTsRestRouter,
  app,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, _c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);

export default app;

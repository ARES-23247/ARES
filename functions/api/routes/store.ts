import { Hono, Context } from "hono";
import { initServer, createHonoEndpoints } from "ts-rest-hono";
import { storeContract } from "../../../shared/schemas/contracts/storeContract";
import type { AppEnv } from "../middleware/utils";
import Stripe from "stripe";
import { logSystemError } from "../middleware/utils";
import { Kysely } from "kysely";
import { DB } from "../../../shared/schemas/database";

const app = new Hono<AppEnv>();
const s = initServer<AppEnv>();

const storeHandlers = {
  getProducts: async (_input: any, c: Context<AppEnv>) => {
    try {
      const db = c.get("db") as Kysely<DB>;
      const products = await db
        .selectFrom("products")
        .selectAll()
        .where("active", "=", 1)
        .execute();

      return {
        status: 200 as const,
        body: products.map((p) => ({
          id: p.id || "",
          name: p.name || "Unknown Product",
          description: p.description || null,
          price_cents: p.price_cents || 0,
          image_url: p.image_url || null,
          active: p.active || 1,
          created_at: p.created_at || null,
        })),
      };
    } catch (err: any) {
      console.error("[Store] Get products failed:", err);
      return { status: 500 as const, body: { error: err.message } };
    }
  },
  createCheckoutSession: async ({ body }: any, c: Context<AppEnv>) => {
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
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        shipping_address_collection: {
          allowed_countries: ["US", "CA"],
        },
      });

      return {
        status: 200 as const,
        body: {
          sessionId: session.id,
          url: session.url || "",
        },
      };
    } catch (err: any) {
      console.error("[Store] Create checkout session failed:", err);
      return { status: 500 as const, body: { error: err.message } };
    }
  },
  getOrders: async (_input: any, c: Context<AppEnv>) => {
    try {
      const sessionUser = c.get("sessionUser");
      if (!sessionUser || sessionUser.role !== "admin") {
        return { status: 401 as const, body: { error: "Unauthorized" } };
      }

      const db = c.get("db") as Kysely<DB>;
      const orders = await db
        .selectFrom("orders")
        .selectAll()
        .orderBy("created_at", "desc")
        .execute();

      return {
        status: 200 as const,
        body: orders.map(o => ({
          ...o,
          id: o.id || "",
          stripe_session_id: o.stripe_session_id || null,
          customer_email: o.customer_email || null,
          shipping_name: o.shipping_name || null,
          shipping_address_line1: o.shipping_address_line1 || null,
          shipping_address_line2: o.shipping_address_line2 || null,
          shipping_city: o.shipping_city || null,
          shipping_state: o.shipping_state || null,
          shipping_postal_code: o.shipping_postal_code || null,
          shipping_country: o.shipping_country || null,
          total_cents: o.total_cents || 0,
          status: o.status || null,
          fulfillment_status: o.fulfillment_status || null,
          created_at: o.created_at || null,
          updated_at: o.updated_at || null,
        }))
      };
    } catch (err: any) {
      console.error("[Store] Get orders failed:", err);
      return { status: 500 as const, body: { error: err.message } };
    }
  },
  updateOrderStatus: async ({ body, params }: any, c: Context<AppEnv>) => {
    try {
      const sessionUser = c.get("sessionUser");
      if (!sessionUser || sessionUser.role !== "admin") {
        return { status: 401 as const, body: { error: "Unauthorized" } };
      }

      const db = c.get("db") as Kysely<DB>;
      await db
        .updateTable("orders")
        .set({ fulfillment_status: body.fulfillment_status })
        .where("id", "=", params.id)
        .execute();

      return {
        status: 200 as const,
        body: { success: true }
      };
    } catch (err: any) {
      console.error("[Store] Update order status failed:", err);
      return { status: 500 as const, body: { error: err.message } };
    }
  },
};

const storeTsRestRouter = s.router(storeContract, storeHandlers as any);

createHonoEndpoints(storeContract, storeTsRestRouter, app);

// We define the webhook separately from ts-rest because webhooks require raw body parsing.
app.post("/webhook", async (c) => {
  const stripeKey = c.env.STRIPE_SECRET_KEY;
  const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return c.json({ error: "Stripe keys not configured" }, 500);
  }

  // @ts-expect-error - Stripe typings mismatch
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.json({ error: "Missing stripe signature" }, 400);
  }

  try {
    const rawBody = await c.req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const db = c.get("db") as Kysely<DB>;

      const shippingDetails = session.shipping_details;

      const orderId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `order-${Date.now()}`;

      await db
        .insertInto("orders")
        .values({
          id: orderId,
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email || null,
          shipping_name: shippingDetails?.name || null,
          shipping_address_line1: shippingDetails?.address?.line1 || null,
          shipping_address_line2: shippingDetails?.address?.line2 || null,
          shipping_city: shippingDetails?.address?.city || null,
          shipping_state: shippingDetails?.address?.state || null,
          shipping_postal_code: shippingDetails?.address?.postal_code || null,
          shipping_country: shippingDetails?.address?.country || null,
          total_cents: session.amount_total || 0,
          status: "paid",
          fulfillment_status: "unfulfilled",
        })
        .execute();
    }

    return c.json({ received: true }, 200);
  } catch (err: any) {
    console.error("[Store] Webhook error:", err);
    await logSystemError(c.get("db") as Kysely<DB>, "Stripe Webhook", err.message);
    return c.json({ error: err.message }, 400);
  }
});

export default app;

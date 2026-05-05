import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ status: "ok", message: "Worker is alive" });
});

export const onRequest = handle(app);

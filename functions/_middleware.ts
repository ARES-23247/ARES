// SEC-DoW: Global Pages Middleware to block *.pages.dev domain
// Intercepts ALL requests (static and API) before they hit the app/router
export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const host = context.request.headers.get("host") || "";

  if (host.endsWith(".pages.dev")) {
    // API requests: block
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Use aresfirst.org" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    // Static / page requests: 301 permanent redirect
    url.hostname = "aresfirst.org";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  // Otherwise, proceed normally
  return context.next();
};

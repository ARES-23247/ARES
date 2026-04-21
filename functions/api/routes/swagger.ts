import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

// Note: To take full advantage of this, other routes should eventually be refactored 
// to use OpenAPIHono and createRoute. For now, we establish the registry.

const swaggerRouter = new OpenAPIHono();

// OpenAPI documentation route
swaggerRouter.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "ARES Web Portal API",
    description: "API for the ARES 23247 Robotics Engineering & Outreach Portal",
  },
});

// Swagger UI mount
swaggerRouter.get("/ui", swaggerUI({ url: "/api/swagger/doc" }));

// Example documented route (Global Search)
const searchRoute = createRoute({
  method: 'get',
  path: '/search-spec',
  request: {
    query: z.object({
      q: z.string().openapi({ example: 'robotics' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            results: z.array(z.any()),
          }),
        },
      },
      description: 'Retrieve search results across docs and posts',
    },
  },
});

swaggerRouter.openapi(searchRoute, (c) => {
  return c.json({ results: [] });
});

export default swaggerRouter;

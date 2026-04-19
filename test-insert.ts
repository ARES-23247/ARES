import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export default {
    async fetch(request, env) {
        try {
            console.log("Triggering test auth insertion");
            
            const kyselyDb = new Kysely({
                dialect: new D1Dialect({
                    database: env.DB,
                }),
            });

            const auth = betterAuth({
                database: kyselyAdapter(kyselyDb, { provider: "sqlite" }),
                emailAndPassword: { enabled: true },
                secret: "test",
                baseURL: "http://localhost",
                user: { additionalFields: { role: { type: "string" } } }
            });

            const result = await auth.api.signUpEmail({
                body: {
                    email: "test_insert_" + Date.now() + "@aresfirst.org",
                    name: "Test User",
                    password: "TestPassword123!"
                }
            });
            return new Response("Success: " + JSON.stringify(result));
        } catch (e) {
            console.error(e);
            return new Response("Error: " + e.message + "\n" + (e.stack || ''), { status: 500 });
        }
    }
}

import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { Kysely } from "kysely";

const auth = betterAuth({
    database: kyselyAdapter(new Kysely({ dialect: { createAdapter: () => ({}), createDriver: () => ({}), createIntrospector: () => ({}), createQueryCompiler: () => ({}) } }), { provider: 'sqlite' })
});

// better-auth internal config options contain the table definitions.
console.dir(auth.options, { depth: null });

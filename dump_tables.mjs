import { getAuth } from "./functions/utils/auth.ts";
import { getAuthTables } from "better-auth/db";

const auth = getAuth({}, {
    BETTER_AUTH_SECRET: "12345678901234567890123456789012",
    BETTER_AUTH_URL: "http://localhost",
});

const tables = getAuthTables(auth.options);
console.log(JSON.stringify(tables, null, 2));

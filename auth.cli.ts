import { getAuth } from "./functions/utils/auth.ts";
export const auth = getAuth(null as any, {
    BETTER_AUTH_SECRET: "secret",
    BETTER_AUTH_URL: "http://localhost",
});

import { getAuth } from "./functions/utils/auth.ts";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth = getAuth(null as any, {
    BETTER_AUTH_SECRET: "secret",
    BETTER_AUTH_URL: "http://localhost",
});

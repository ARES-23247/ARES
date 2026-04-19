import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: window.location.origin + "/api", // Better Auth is mounted at /api/auth
});

export const { signIn, signOut, useSession } = authClient;

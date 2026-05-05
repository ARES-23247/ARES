import { initServer } from "ts-rest-hono";
import { AppEnv } from "./utils";

export const s = initServer<AppEnv>();

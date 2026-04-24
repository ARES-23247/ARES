import { initQueryClient } from "@ts-rest/react-query";
import { apiContract } from "../schemas/contracts";

export { fetchBlob, uploadFile, fetchJson } from "../utils/apiClient";

export const api = initQueryClient(apiContract, {
  baseUrl: "/api",
  baseHeaders: {
    "Content-Type": "application/json",
  },
});


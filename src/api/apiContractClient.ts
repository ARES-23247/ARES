import { initQueryClient } from "@ts-rest/react-query";
import { sponsorContract } from "../schemas/contracts/sponsorContract";

export const apiContractClient = initQueryClient(sponsorContract, {
  baseUrl: "",
  baseHeaders: {
    "Content-Type": "application/json",
  },
});

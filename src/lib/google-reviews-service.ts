import { api } from "@/lib/api";
import type { GoogleReviewsData } from "@/types/google-reviews";

/**
 * The browser only talks to QARWAAN's API. Keep provider details and every
 * credential in the Express service, never in this module.
 */
let pendingRequest: Promise<GoogleReviewsData> | null = null;

export const googleReviewsService = {
  get: () => {
    if (!pendingRequest) {
      pendingRequest = api<GoogleReviewsData>("/api/google-reviews").catch((error) => {
        pendingRequest = null;
        throw error;
      });
    }
    return pendingRequest;
  },
  refresh: () => {
    pendingRequest = null;
    return googleReviewsService.get();
  },
};

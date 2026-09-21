import { useEffect, useState } from "react";
import { GoogleReviewBadge } from "@/components/google-review-badge";
import { GoogleReviewsSection } from "@/components/google-reviews-section";
import { googleReviewsService } from "@/lib/google-reviews-service";
import type { GoogleReviewsData } from "@/types/google-reviews";

export function useGoogleReviews() {
  const [data, setData] = useState<GoogleReviewsData>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  useEffect(() => { let active = true; googleReviewsService.get().then((result) => { if (active) setData(result); }).catch(() => { if (active) setHasError(true); }).finally(() => { if (active) setIsLoading(false); }); return () => { active = false; }; }, []);
  return { data, isLoading, hasError };
}

export function HeroGoogleReviews() { const state = useGoogleReviews(); return <GoogleReviewBadge data={state.data} isLoading={state.isLoading} />; }
export function GoogleReviews() { const state = useGoogleReviews(); return <GoogleReviewsSection data={state.data} isLoading={state.isLoading} error={state.hasError} />; }

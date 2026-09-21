import { Star } from "lucide-react";
import type { GoogleReviewsData } from "@/types/google-reviews";

type Props = {
  data?: GoogleReviewsData;
  isLoading: boolean;
};

function GoogleMark() {
  return <span aria-hidden="true" className="font-sans text-xs font-semibold tracking-tight text-[#4285F4]">G</span>;
}

export function GoogleReviewBadge({ data, isLoading }: Props) {
  if (!isLoading && (!data || data.rating == null || data.reviewCount == null)) return null;

  if (isLoading) {
    return <div aria-label="Loading Google reviews" className="h-[76px] w-[264px] animate-pulse rounded-[1.5rem] border border-white/40 bg-white/35 backdrop-blur-md" />;
  }

  const content = (
    <>
      <div className="flex -space-x-2.5" aria-hidden="true">
        {(data?.reviews ?? []).slice(0, 4).map((review, index) => (
          <div key={`${review.authorName}-${index}`} className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-primary text-[10px] font-medium text-white shadow-sm">
            {review.authorPhotoUrl ? <img src={review.authorPhotoUrl} alt="" className="h-full w-full object-cover" /> : (review.authorName || "Q").slice(0, 1).toUpperCase()}
          </div>
        ))}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-primary">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
          <span>{data?.rating} on Google</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-primary/70">
          <GoogleMark />
          <span>{data?.reviewCount} Google Reviews</span>
        </div>
      </div>
    </>
  );

  const className = "group inline-flex min-h-[76px] items-center gap-4 rounded-[1.5rem] border border-white/50 bg-[#f8f4eb]/90 px-4 py-3 shadow-[0_12px_30px_rgba(0,27,25,0.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-[#fffdf8]/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90";

  if (!data?.googleMapsUrl) {
    return <div className={`${className} cursor-default`} aria-label="Google reviews preview">{content}</div>;
  }

  return <a href={data.googleMapsUrl} target="_blank" rel="noreferrer" className={className} aria-label="Read QARWAAN reviews on Google (opens in a new tab)">{content}</a>;
}

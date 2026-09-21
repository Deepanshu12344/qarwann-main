export type GoogleReview = {
  authorName: string | null;
  authorPhotoUrl: string | null;
  rating: number | null;
  text: string | null;
  publishTime: string | null;
  googleMapsUrl: string | null;
  sourceLabel?: string | null;
};

export type GoogleReviewsData = {
  rating: number | null;
  reviewCount: number | null;
  placeId: string | null;
  googleMapsUrl: string | null;
  reviews: GoogleReview[];
};

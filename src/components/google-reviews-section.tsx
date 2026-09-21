import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { googleReviewsService } from "@/lib/google-reviews-service";
import type { GoogleReview, GoogleReviewsData } from "@/types/google-reviews";

const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

function Stars({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  return <div className="flex gap-0.5 text-accent" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "fill-current" : "text-primary/15"}`} aria-hidden="true" />)}
  </div>;
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const [expanded, setExpanded] = useState(false);
  const long = (review.text?.length ?? 0) > 210;
  const text = !expanded && long ? `${review.text?.slice(0, 210).trimEnd()}…` : review.text;
  const date = review.publishTime ? new Date(review.publishTime) : null;
  const initial = (review.authorName || "Q").slice(0, 1).toUpperCase();

  return <article className="flex min-h-[330px] w-[86%] shrink-0 snap-start flex-col rounded-sm border border-primary/12 bg-card p-6 shadow-[0_10px_24px_rgba(0,70,67,0.05)] sm:w-[47%] md:p-7 lg:w-[calc((100%-3rem)/3)]">
    <div className="flex items-center justify-between gap-3"><Stars rating={review.rating} /><span className="font-sans text-xs font-medium text-[#4285F4]">{review.sourceLabel || "Google"}</span></div>
    <blockquote className="mt-7 flex-1 font-serif text-[1.35rem] leading-[1.35] text-primary sm:text-[1.45rem]">{text || ""}</blockquote>
    {long && <button type="button" onClick={() => setExpanded(!expanded)} className="mt-3 w-fit text-xs font-medium tracking-wide text-primary underline decoration-accent underline-offset-4">{expanded ? "Show less" : "Read more"}</button>}
    <div className="mt-7 flex items-center gap-3 border-t border-primary/10 pt-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-medium text-primary-foreground">
        {review.authorPhotoUrl ? <img src={review.authorPhotoUrl} alt="" className="h-full w-full object-cover" /> : initial}
      </div>
      <div className="min-w-0"><p className="truncate text-sm font-medium text-primary">{review.authorName || "Google reviewer"}</p>{date && !Number.isNaN(date.valueOf()) && <p className="mt-0.5 text-xs text-muted-foreground">{dateFormatter.format(date)}</p>}</div>
      {review.googleMapsUrl && <a href={review.googleMapsUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/15 text-primary transition hover:bg-primary hover:text-primary-foreground" aria-label={`Read ${review.authorName || "this review"} on Google`}><ArrowUpRight className="h-3.5 w-3.5" /></a>}
    </div>
  </article>;
}

function SkeletonCard() { return <div className="h-[330px] w-[86%] shrink-0 animate-pulse rounded-sm border border-primary/10 bg-primary/[0.045] p-7 sm:w-[47%] lg:w-[calc((100%-3rem)/3)]"><div className="h-4 w-24 rounded bg-primary/10" /><div className="mt-9 space-y-3"><div className="h-5 w-full rounded bg-primary/10" /><div className="h-5 w-11/12 rounded bg-primary/10" /><div className="h-5 w-3/4 rounded bg-primary/10" /></div><div className="mt-28 h-10 w-32 rounded bg-primary/10" /></div>; }

export function GoogleReviewsSection({ data: initialData, isLoading: initialLoading, error: initialError }: { data?: GoogleReviewsData; isLoading: boolean; error?: boolean }) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [hasError, setHasError] = useState(initialError ?? false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setData(initialData); setIsLoading(initialLoading); setHasError(initialError ?? false); }, [initialData, initialLoading, initialError]);
  const retry = async () => { setIsLoading(true); setHasError(false); try { setData(await googleReviewsService.refresh()); } catch { setHasError(true); } finally { setIsLoading(false); } };
  const scroll = (direction: 1 | -1) => { const el = scrollerRef.current; if (!el) return; const card = el.querySelector<HTMLElement>("article, div"); el.scrollBy({ left: direction * ((card?.offsetWidth ?? el.clientWidth) + 24), behavior: "smooth" }); };
  const usable = data && data.rating != null && data.reviewCount != null;

  return <section aria-labelledby="google-reviews-heading" className="border-t border-primary/10 bg-secondary/45 px-5 py-24 sm:px-8 md:py-32"><div className="mx-auto max-w-7xl">
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.65 }} className="mx-auto max-w-2xl text-center">
      <span className="eyebrow text-accent">Travelers' words</span><h2 id="google-reviews-heading" className="mt-4 font-serif text-4xl leading-tight text-primary sm:text-5xl md:text-6xl">Stories from the <em className="not-italic text-accent">journey.</em></h2>
      {isLoading ? <div className="mx-auto mt-7 h-8 w-48 animate-pulse rounded bg-primary/10" /> : usable && <div className="mt-6 flex items-center justify-center gap-2 text-primary"><Stars rating={data.rating} /><span className="font-serif text-2xl">{data.rating}</span><span className="text-sm text-muted-foreground">on Google · {data.reviewCount} reviews</span></div>}
    </motion.div>
    {hasError || !usable && !isLoading ? <div className="mx-auto mt-12 max-w-xl border-y border-primary/10 py-9 text-center"><p className="font-serif text-2xl text-primary">Reviews will be available soon.</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">We could not load our Google review feed just now. The rest of your QARWAAN experience is unaffected.</p><button type="button" onClick={retry} className="mt-5 text-sm font-medium text-primary underline decoration-accent underline-offset-4">Try again</button></div> : data && !data.reviews.length && !isLoading ? <div className="mx-auto mt-12 max-w-xl border-y border-primary/10 py-9 text-center"><p className="font-serif text-2xl text-primary">No featured reviews yet.</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Our Google review feed is connected, but there are no reviews available to display right now.</p></div> : <>
      <div className="mt-14 flex items-center gap-3 sm:gap-4"><button type="button" onClick={() => scroll(-1)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 text-primary transition hover:bg-primary hover:text-primary-foreground" aria-label="Previous reviews"><ChevronLeft className="h-4 w-4" /></button><div ref={scrollerRef} className="flex min-w-0 flex-1 snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{isLoading ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />) : data?.reviews.map((review, i) => <ReviewCard key={`${review.authorName}-${i}`} review={review} />)}</div><button type="button" onClick={() => scroll(1)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 text-primary transition hover:bg-primary hover:text-primary-foreground" aria-label="Next reviews"><ChevronRight className="h-4 w-4" /></button></div>
      {data?.googleMapsUrl && <div className="mt-10 text-center"><a href={data.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-b border-accent pb-1 text-sm font-medium tracking-[0.14em] uppercase text-primary">Read all reviews on Google <ArrowUpRight className="h-4 w-4" /></a></div>}
    </>}
  </div></section>;
}

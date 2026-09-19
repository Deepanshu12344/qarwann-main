import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QARWAAN_ITINERARIES } from "@/data/qarwaan-itineraries";

const WHATSAPP_NUMBER = "918796162117";
const DEFAULT_WHATSAPP_MESSAGE =
  "Hi Qarwaan, I'd like to know more about your travel journeys. Please help me plan my trip.";

type AnalyticsEventName = "whatsapp_click" | "enquiry_cta_click";

/**
 * Uses an analytics implementation only when one has already been added to
 * the site. This deliberately does not initialise GA/GTM or add a new script.
 */
function trackCtaClick(event: AnalyticsEventName, tripName?: string) {
  if (typeof window === "undefined") return;

  const parameters = {
    page_path: window.location.pathname,
    page_title: document.title,
    trip_name: tripName,
    cta_location: "sticky_bottom",
  };
  const analyticsWindow = window as Window & {
    gtag?: (event: "event", name: AnalyticsEventName, params: typeof parameters) => void;
    dataLayer?: Array<Record<string, unknown>>;
  };

  if (typeof analyticsWindow.gtag === "function") {
    analyticsWindow.gtag("event", event, parameters);
  } else if (Array.isArray(analyticsWindow.dataLayer)) {
    analyticsWindow.dataLayer.push({ event, ...parameters });
  }
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.47 0 .12 5.35.12 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.28-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.19-3.46-8.41Zm-8.47 18.33h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.73.98 1-3.63-.24-.37a9.88 9.88 0 0 1-1.53-5.27c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.03 7.01 2.91a9.84 9.84 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.91 9.92Zm5.44-7.44c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5a9.1 9.1 0 0 1-1.68-2.09c-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

function tripEnquirySearch(trip: (typeof QARWAAN_ITINERARIES)[number]) {
  const details = [
    trip.country && `Country: ${trip.country}`,
    trip.citiesCovered?.length && `Cities covered: ${trip.citiesCovered.join(", ")}`,
    (trip.startPoint || trip.endPoint) &&
      `Route: ${[trip.startPoint, trip.endPoint].filter(Boolean).join(" → ")}`,
    trip.bestSeason?.length && `Best season: ${trip.bestSeason.join(", ")}`,
    trip.tripType && `Trip type: ${trip.tripType}`,
    trip.idealFor?.length && `Ideal for: ${trip.idealFor.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    trip: trip.packageName,
    duration: trip.duration,
    budget: trip.budgetFrom?.toString(),
    details: details || undefined,
    image: trip.coverImage,
  };
}

export function StickyJourneyCta() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [overlayOpen, setOverlayOpen] = useState(false);
  const trip = useMemo(() => {
    const slug = pathname.match(/^\/trips\/([^/]+)\/?$/)?.[1];
    return slug ? QARWAAN_ITINERARIES.find((item) => item.slug === slug) : undefined;
  }, [pathname]);
  const isWeekendGetaway = Boolean(trip && trip.durationDays <= 3);
  const tripKind = isWeekendGetaway ? "weekend getaway" : "journey";
  const tripReference = trip?.packageName.toLowerCase().includes("weekend")
    ? trip.packageName
    : trip && `${trip.packageName} ${tripKind}`;
  const message = trip
    ? `Hi Qarwaan, I'm interested in the ${tripReference}. Please share availability and pricing.`
    : DEFAULT_WHATSAPP_MESSAGE;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  useEffect(() => {
    const updateOverlayState = () => {
      setOverlayOpen(
        document.body.style.overflow === "hidden" ||
          Boolean(document.querySelector('[role="dialog"]')),
      );
    };
    const onMenuChange = (event: Event) => {
      setOverlayOpen(Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open));
    };
    const observer = new MutationObserver(updateOverlayState);

    updateOverlayState();
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
      subtree: true,
    });
    window.addEventListener("qarwaan:overlay-change", onMenuChange);
    return () => {
      observer.disconnect();
      window.removeEventListener("qarwaan:overlay-change", onMenuChange);
    };
  }, []);

  if (overlayOpen || pathname.startsWith("/admin")) return null;

  const buttonClass =
    "inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 px-3 py-3 text-center text-xs font-medium uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:px-4";

  return (
    <aside
      aria-label="Contact Qarwaan"
      data-sticky-travel-cta
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-3 pt-3 shadow-[0_-8px_30px_rgba(0,70,67,0.10)] backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 md:inset-x-auto md:bottom-6 md:right-6 md:border md:p-1.5 md:shadow-xl"
    >
      <div className="mx-auto flex w-full max-w-xl overflow-hidden rounded-md border border-primary/15 bg-background md:max-w-none md:rounded-sm md:border-0">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Contact Qarwaan on WhatsApp"
          onClick={() => trackCtaClick("whatsapp_click", trip?.packageName)}
          className={`${buttonClass} bg-primary text-primary-foreground hover:bg-primary/90 md:min-w-40`}
        >
          <WhatsAppIcon className="h-4 w-4 shrink-0 text-accent" />
          <span className="truncate">WhatsApp Us</span>
        </a>
        {trip ? (
          <Link
            to="/enquire"
            search={tripEnquirySearch(trip)}
            aria-label="Plan your trip with Qarwaan"
            onClick={() => trackCtaClick("enquiry_cta_click", trip.packageName)}
            className={`${buttonClass} bg-primary text-primary-foreground hover:bg-primary/90 md:min-w-40`}
          >
            <span className="truncate">Plan My Trip</span>
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            to="/enquire"
            aria-label="Plan your trip with Qarwaan"
            onClick={() => trackCtaClick("enquiry_cta_click")}
            className={`${buttonClass} bg-primary text-primary-foreground hover:bg-primary/90 md:min-w-40`}
          >
            <span className="truncate">Plan My Trip</span>
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        )}
      </div>
    </aside>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_URL } from "@/lib/seo";

type WeekendTrip = {
  id: string;
  slug: string;
  packageName: string;
  title: string;
  destination: string;
  place: string;
  coverImage: string;
  cover?: string;
  img?: string;
  duration?: string;
  nights?: number;
};

const FALLBACK_WEEKENDS: WeekendTrip[] = [
  {
    id: "jim-corbett-wild-trails-and-forest-escape",
    slug: "jim-corbett-wild-trails-and-forest-escape",
    packageName: "Jim Corbett – Wild Trails & Forest Escape",
    title: "Jim Corbett",
    destination: "Jim Corbett",
    place: "Jim Corbett",
    coverImage: "https://res.cloudinary.com/dnnkpyi1h/image/upload/v1793191307/qarwaan/images/jim-corbett/hero-image.png",
    nights: 2,
  },
  {
    id: "rishikesh-reset-by-the-ganga-weekend-escape",
    slug: "rishikesh-reset-by-the-ganga-weekend-escape",
    packageName: "Rishikesh – Reset by the Ganga",
    title: "Rishikesh",
    destination: "Rishikesh",
    place: "Rishikesh",
    coverImage: "https://res.cloudinary.com/dnnkpyi1h/image/upload/v1793191340/qarwaan/images/rishikesh/hero-image.jpg",
    nights: 2,
  },
  {
    id: "coorg-coffee-forests-kodava-culture",
    slug: "coorg-coffee-forests-kodava-culture",
    packageName: "Coorg – Coffee, Forests & Kodava Culture",
    title: "Coorg",
    destination: "Coorg",
    place: "Coorg",
    coverImage: "https://res.cloudinary.com/dnnkpyi1h/image/upload/v1793191310/qarwaan/images/coorg/main.png",
    nights: 2,
  },
  {
    id: "ooty-coonoor-tea-trails-misty-hills-nilgiri-escapes",
    slug: "ooty-coonoor-tea-trails-misty-hills-nilgiri-escapes",
    packageName: "Ooty & Coonoor – Tea Trails, Misty Hills & Nilgiri Escapes",
    title: "Ooty & Coonoor",
    destination: "Ooty & Coonoor",
    place: "Ooty & Coonoor",
    coverImage: "https://res.cloudinary.com/dnnkpyi1h/image/upload/v1793191341/qarwaan/images/ooty/main-image.png",
    nights: 2,
  },
  {
    id: "darjeeling-tea-trails-himalayan-views-toy-train-heritage",
    slug: "darjeeling-tea-trails-himalayan-views-toy-train-heritage",
    packageName: "Darjeeling – Tea Trails & Himalayan Views",
    title: "Darjeeling",
    destination: "Darjeeling",
    place: "Darjeeling",
    coverImage: "https://res.cloudinary.com/dnnkpyi1h/image/upload/v1793191340/qarwaan/images/darjeeling/main-image.png",
    nights: 2,
  },
  {
    id: "hampi-heritage-weekend-escape",
    slug: "hampi-heritage-weekend-escape",
    packageName: "Hampi – Ancient Stones & Stories",
    title: "Hampi",
    destination: "Hampi",
    place: "Hampi",
    coverImage: "https://res.cloudinary.com/dnnkpyi1h/image/upload/v1793191325/qarwaan/images/hampi/hero-image-hampi.png",
    nights: 2,
  },
  {
    id: "kasauli-colonial-charm-pine-trails-slow-mountain-living",
    slug: "kasauli-colonial-charm-pine-trails-slow-mountain-living",
    packageName: "Kasauli – Colonial Charm & Pine Trails",
    title: "Kasauli",
    destination: "Kasauli",
    place: "Kasauli",
    coverImage: "https://res.cloudinary.com/dnnkpyi1h/image/upload/v1793191336/qarwaan/images/kasauli/hero-image.png",
    nights: 2,
  },
];

export const Route = createFileRoute("/weekend-getaways")({
  head: () => ({
    meta: [
      { title: "Weekend Getaways — QARWAAN" },
      { name: "description", content: "Discover Qarwaan's curated weekend getaways." },
      { property: "og:title", content: "Weekend Getaways — QARWAAN" },
      { property: "og:description", content: "Discover Qarwaan's curated weekend getaways." },
      { property: "og:url", content: `${SITE_URL}/weekend-getaways` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/weekend-getaways` }],
  }),
  component: WeekendGetawaysPage,
});

function WeekendGetawaysPage() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const { data } = useQuery<{ items: WeekendTrip[] }>({
    queryKey: ["trips", "weekend"],
    queryFn: async () => {
      const res = await fetch("/api/public/trips?category=weekend&limit=20");
      if (!res.ok) throw new Error("Failed to load weekend getaways");
      return res.json();
    },
    staleTime: 60_000,
  });

  const trips = (data?.items && data.items.length > 0 ? data.items : FALLBACK_WEEKENDS);

  const scrollBy = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector<HTMLElement>("[data-getaway-card]");
    const gap = Number.parseFloat(getComputedStyle(scroller).gap) || 0;
    scroller.scrollBy({ left: direction * (card ? card.offsetWidth + gap : scroller.clientWidth), behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader page="weekends" />

      <section className="px-5 py-24 sm:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h1 className="mt-4 font-serif text-5xl leading-[0.98] text-primary sm:text-6xl md:text-7xl">
              Weekend <em className="not-italic text-accent">Getaways.</em>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Quick, well-composed escapes for when time is short but the craving isn't.
            </p>
          </div>

          <div className="mt-14 flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Previous weekend getaways"
              onClick={() => scrollBy(-1)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div
              ref={scrollerRef}
              className="flex min-w-0 flex-1 items-stretch snap-x snap-mandatory gap-6 overflow-x-auto overflow-y-hidden scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {trips.map((trip) => {
                const cover = trip.coverImage || trip.cover || trip.img;
                const destTitle = trip.destination || trip.place || trip.title;
                const subtitle = (trip.packageName || "").split(/[–—\-]/)[1]?.trim() || trip.packageName;
                return (
                  <motion.div
                    key={trip.slug}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                    data-getaway-card
                    className="h-full w-[85%] shrink-0 snap-start sm:w-[48%] md:w-[32%]"
                  >
                    <Link to="/trips/$slug" params={{ slug: trip.slug }} className="group block h-full">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                        <img
                          src={cover}
                          alt={trip.packageName}
                          loading="lazy"
                          width={1280}
                          height={1600}
                          className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05]"
                        />
                        <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-primary">
                          {trip.nights ? `${trip.nights} nights` : "2 nights"}
                        </span>
                        <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase text-accent-foreground">
                          On Request
                        </span>
                      </div>
                      <div className="mt-5 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="font-serif text-2xl text-primary">{destTitle}</h2>
                          <p className="mt-1 text-xs tracking-[0.2em] uppercase text-muted-foreground">
                            {subtitle}
                          </p>
                        </div>
                        <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Next weekend getaways"
              onClick={() => scrollBy(1)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

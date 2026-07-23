import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Compass,
  MapPin,
  Sparkles,
  Sun,
  Utensils,
  Mountain,
  Music,
  BedDouble,
  Accessibility,
  Gem,
  Star,
  Users,
  Trees,
  Landmark,
  Building2,
  Flame,
  Check,
  X,
  MessageSquare,
  ClipboardList,
  Plane,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type JourneyDay = {
  day: number;
  route?: string;
  location: string;
  phase?: string;
  nature?: boolean;
  adventure?: boolean;
  culture?: boolean;
  spiritual?: boolean;
  heritage?: boolean;
  modern?: boolean;
  keyAttractions?: string[];
  experienceDetails?: string;
  hiddenGems?: string[];
  activities?: string[];
  localFood?: string[];
  localExperience?: string;
  festivals?: string[];
  stayType?: string;
  accessibility?: string;
  images?: string[];
};

type TripDetail = {
  id: string;
  slug: string;
  packageName: string;
  coverImage?: string;
  country?: string;
  duration?: string;
  durationDays: number;
  citiesCovered?: string[];
  bestSeason?: string[];
  startPoint?: string;
  endPoint?: string;
  tripType?: string;
  idealFor?: string[];
  budgetFrom?: number;
  detailedOverview?: string;
  whyThisTrip?: string;
  keyExperiences?: string[];
  inclusions?: string[];
  exclusions?: string[];
  howItWorks?: { title: string; description: string }[];
  journeyDays: JourneyDay[];
};

const CATEGORY_META = [
  { key: "nature", label: "Nature", Icon: Trees },
  { key: "adventure", label: "Adventure", Icon: Mountain },
  { key: "culture", label: "Culture", Icon: Landmark },
  { key: "spiritual", label: "Spiritual", Icon: Flame },
  { key: "heritage", label: "Heritage", Icon: Landmark },
  { key: "modern", label: "Modern", Icon: Building2 },
] as const;

const ITINERARY_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=85",
];

export const Route = createFileRoute("/trips/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `QARWAAN · Trip ${params.slug}` },
      {
        name: "description",
        content:
          "A curated QARWAAN journey — detailed itinerary, key experiences, and signature stays.",
      },
    ],
  }),
  component: TripDetailsPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl text-primary">
            We couldn't load this journey
          </h1>
          <p className="mt-2 text-sm text-foreground/70">{error.message}</p>
          <button
            onClick={() => {
              reset();
              router.invalidate();
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-primary">Journey not found</h1>
        <Link
          to="/trips"
          className="mt-6 inline-flex items-center gap-2 text-sm underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all trips
        </Link>
      </div>
    </div>
  ),
});

function TripDetailsPage() {
  const { slug } = Route.useParams();

  const { data, isLoading, error } = useQuery<TripDetail>({
    queryKey: ["trip", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/trips/${slug}`);
      if (!res.ok) throw new Error("Failed to load trip");
      return res.json();
    },
  });

  if (isLoading) return <TripSkeleton />;
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/70">Trip unavailable.</p>
      </div>
    );
  }

  // Group days by Location, preserving order of first appearance.
  const grouped: { location: string; days: JourneyDay[] }[] = [];
  for (const d of data.journeyDays ?? []) {
    if (!d.location) continue;
    const existing = grouped.find((g) => g.location === d.location);
    if (existing) existing.days.push(d);
    else grouped.push({ location: d.location, days: [d] });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader page="destinations" />
      <Hero trip={data} />
      <Overview trip={data} />
      {data.keyExperiences && data.keyExperiences.length > 0 && (
        <KeyExperiences items={data.keyExperiences} />
      )}
      <Collage trip={data} />
      {grouped.length > 0 && (
        <Itinerary
          groups={grouped}
          totalDays={data.durationDays ?? data.journeyDays.length}
          coverImage={data.coverImage}
        />
      )}
      <InclusionsExclusions trip={data} />
      {/* Temporarily hidden */}
      {/* <HowItWorks trip={data} /> */}
      <CtaBand trip={data} />
      <SiteFooter />
      <StickyEnquire trip={data} />
    </div>
  );
}

/* ---------------- Navbar ---------------- */
function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl tracking-[0.3em] text-primary">
          QARWAAN
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/" className="text-foreground/70 hover:text-foreground">Home</Link>
          <Link to="/trips" className="text-foreground/70 hover:text-foreground">Destinations</Link>
          <Link to="/about-us" className="text-foreground/70 hover:text-foreground">About Us</Link>
          <Link to="/enquire" className="text-foreground/70 hover:text-foreground">Plan Your Journey</Link>
        </nav>
        <Link
          to="/trips"
          className="inline-flex items-center gap-1.5 text-sm text-foreground/80 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All Trips
        </Link>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ trip }: { trip: TripDetail }) {
  return (
    <section className="relative h-[80vh] min-h-[560px] w-full overflow-hidden">
      {trip.coverImage && (
        <img
          src={trip.coverImage}
          alt={trip.packageName}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
      <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-end pb-12 md:pb-20 text-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.05] max-w-4xl">
            {trip.packageName}
          </h1>
          <dl className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            {trip.duration && (
              <HeroMeta icon={<Calendar className="h-4 w-4" />} label="Duration">
                {trip.duration}
              </HeroMeta>
            )}
            {trip.citiesCovered && trip.citiesCovered.length > 0 && (
              <HeroMeta icon={<MapPin className="h-4 w-4" />} label="Cities">
                {trip.citiesCovered.join(" · ")}
              </HeroMeta>
            )}
            {trip.bestSeason && trip.bestSeason.length > 0 && (
              <HeroMeta icon={<Sun className="h-4 w-4" />} label="Best Season">
                {trip.bestSeason.join(", ")}
              </HeroMeta>
            )}
            {trip.startPoint && (
              <HeroMeta icon={<Compass className="h-4 w-4" />} label="Start · End">
                {trip.startPoint}
                {trip.endPoint ? ` → ${trip.endPoint}` : ""}
              </HeroMeta>
            )}
          </dl>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/enquire"
              search={{ trip: trip.packageName }}
              className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm font-medium hover:bg-accent/90 transition"
            >
              Enquire Now <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href="#itinerary"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm hover:bg-white/10 transition"
            >
              View Itinerary
            </a>
            {trip.budgetFrom ? (
              <div className="text-sm text-white/80">
                From{" "}
                <span className="font-medium text-white">
                  ₹{trip.budgetFrom.toLocaleString("en-IN")}
                </span>{" "}
                per person
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HeroMeta({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-white/70">
        {icon} {label}
      </dt>
      <dd className="mt-1.5 text-sm md:text-base text-white">{children}</dd>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ trip }: { trip: TripDetail }) {
  if (!trip.detailedOverview && !trip.whyThisTrip) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-5 gap-10">
      {trip.detailedOverview && (
        <div className="md:col-span-3">
          {/* <SectionLabel>The Journey</SectionLabel> */}
          <h2 className="mt-3 font-serif text-3xl md:text-4xl text-primary leading-tight">
            Detailed Overview
          </h2>
          <p className="mt-6 text-foreground/80 leading-relaxed text-[15px] md:text-base whitespace-pre-line">
            {trip.detailedOverview}
          </p>
        </div>
      )}
      {trip.whyThisTrip && (
        <aside className="md:col-span-2 rounded-2xl bg-primary text-primary-foreground p-8 md:p-10">
          <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Why This Trip
          </div>
          <p className="mt-5 leading-relaxed text-primary-foreground/90 text-[15px] whitespace-pre-line">
            {trip.whyThisTrip}
          </p>
          <div className="mt-8 pt-6 border-t border-primary-foreground/15 grid grid-cols-2 gap-5 text-xs">
            {trip.startPoint && <Pair label="Start" value={trip.startPoint} />}
            {trip.endPoint && <Pair label="End" value={trip.endPoint} />}
            {trip.tripType && <Pair label="Style" value={trip.tripType} />}
            {trip.idealFor && trip.idealFor.length > 0 && (
              <Pair label="Ideal For" value={trip.idealFor.join(", ")} />
            )}
          </div>
        </aside>
      )}
    </section>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-primary-foreground/60 uppercase tracking-[0.2em] text-[10px]">
        {label}
      </div>
      <div className="mt-1 text-primary-foreground">{value}</div>
    </div>
  );
}

/* ---------------- Key Experiences ---------------- */
function KeyExperiences({ items }: { items: string[] }) {
  const icons = [Star, Gem, Sparkles, Utensils, Music, Compass];
  return (
    <section className="bg-card/40 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        {/* <SectionLabel>Signature Moments</SectionLabel> */}
        <h2 className="mt-3 font-serif text-3xl md:text-4xl text-primary">
          Key Experiences
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((exp, i) => {
            const Icon = icons[i % icons.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative rounded-2xl bg-background border border-border p-6 md:p-7 hover:border-accent/60 transition"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-foreground leading-relaxed text-[15px]">
                  {exp}
                </p>
                <div className="mt-6 text-xs tracking-[0.25em] uppercase text-foreground/40">
                  Experience · 0{i + 1}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Collage ---------------- */
function Collage({ trip }: { trip: TripDetail }) {
  const tripImages = Array.from(
    new Set([
      trip.coverImage,
      ...trip.journeyDays.flatMap((day) => day.images ?? []),
    ].filter(Boolean))
  ) as string[];
  const images = Array.from(
    { length: 4 },
    (_, index) => tripImages[index % tripImages.length] ?? ITINERARY_FALLBACK_IMAGES[index]
  );

  return (
    <section
      className="h-[70svh] min-h-[420px] w-full overflow-hidden bg-background"
      aria-label={`${trip.country ?? trip.packageName} journey highlights`}
    >
      <div className="grid h-full grid-cols-2 grid-rows-3 gap-3 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={
              index === 0
                ? "row-span-2 overflow-hidden md:row-span-2"
                : index === 1
                  ? "row-span-2 overflow-hidden md:col-start-2 md:row-span-2"
                  : index === 2
                    ? "overflow-hidden md:col-start-3"
                    : "overflow-hidden md:col-start-3"
            }
          >
            <img
              src={src}
              alt={`${trip.country ?? trip.packageName} travel scene ${index + 1}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Itinerary ---------------- */
function Itinerary({
  groups,
  totalDays,
  coverImage,
}: {
  groups: { location: string; days: JourneyDay[] }[];
  totalDays: number;
  coverImage?: string;
}) {
  return (
    <section
      id="itinerary"
      className="px-7 py-16 md:px-16 md:py-24 lg:px-20 xl:px-28"
    >
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <SectionLabel>Day by Day</SectionLabel>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl text-primary">
            Your Itinerary
          </h2>
        </div>
        <p className="text-sm text-foreground/60">
          {totalDays} days · {groups.length} locations
        </p>
      </div>

      <div className="mt-10 space-y-20 md:mt-14 md:space-y-28">
          {groups.map((group, gi) => {
            return (
              <div
                key={gi}
                id={`loc-${gi}`}
                className="scroll-mt-24"
              >
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.55 }}
                  className="mx-auto max-w-3xl pb-7 text-center"
                >
                  <div className="flex flex-wrap items-baseline justify-center gap-4">
                    <h3 className="font-serif text-3xl md:text-4xl text-primary">
                      {group.location}
                    </h3>
                    <span className="text-sm text-foreground/60">
                      {group.days.length}{" "}
                      {group.days.length === 1 ? "Experience" : "Experiences"}
                    </span>
                  </div>
                </motion.div>

                <div className="mx-auto mt-10 w-[90%] space-y-12 md:mt-14 md:space-y-16">
                  {group.days.map((d, dayIndex) => (
                    <DayCard
                      key={d.day}
                      d={d}
                      images={galleryImages(d.images ?? [], coverImage, gi + dayIndex)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}

function galleryImages(images: string[], coverImage?: string, offset = 0) {
  const supplied = Array.from(new Set(images.filter(Boolean)));
  const fallback = coverImage ? [coverImage, ...ITINERARY_FALLBACK_IMAGES] : ITINERARY_FALLBACK_IMAGES;
  const rotatedFallback = fallback.map((_, i) => fallback[(i + offset) % fallback.length]);
  return Array.from(new Set([...supplied, ...rotatedFallback])).slice(0, 4);
}

function DayCard({ d, images }: { d: JourneyDay; images: string[] }) {
  const categories = CATEGORY_META.filter((c) => (d as any)[c.key]);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card/60 md:rounded-3xl">
      <div className="border-b border-border px-5 py-5 md:px-7">
          <h3 className="font-serif text-2xl text-primary md:text-3xl">
            Day {d.day} <span className="text-accent">—</span> {d.location}
          </h3>
      </div>
      <div className="px-5 py-6 md:px-7 md:py-7">
        {categories.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {categories.map(({ key, label, Icon }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary px-3 py-1 text-[11px] uppercase tracking-[0.15em]"
              >
                <Icon className="h-3 w-3" /> {label}
              </span>
            ))}
          </div>
        )}

        {d.experienceDetails && (
          <p className="text-foreground/80 leading-relaxed text-[15px]">
            {d.experienceDetails}
          </p>
        )}

        <DayGallery day={d.day} location={d.location} images={images} />

        <div className="mt-6 grid md:grid-cols-2 gap-x-8 gap-y-6">
          <DayBlock
            icon={<MapPin className="h-4 w-4" />}
            title="Key Attractions"
            items={d.keyAttractions}
          />
          <DayBlock
            icon={<Gem className="h-4 w-4" />}
            title="Hidden Gems"
            items={d.hiddenGems}
          />
          <DayBlock
            icon={<Mountain className="h-4 w-4" />}
            title="Activities"
            items={d.activities}
          />
          <DayBlock
            icon={<Utensils className="h-4 w-4" />}
            title="Local Food"
            items={d.localFood}
          />
          <DayBlock
            icon={<Music className="h-4 w-4" />}
            title="Festivals"
            items={d.festivals}
          />
          <DayParagraph
            icon={<Sparkles className="h-4 w-4" />}
            title="Local Experience"
            text={d.localExperience}
          />
        </div>

        {(d.stayType || d.accessibility) && (
          <div className="mt-7 pt-5 border-t border-border grid sm:grid-cols-2 gap-4 text-sm">
            {d.stayType && (
              <div className="flex items-start gap-2">
                <BedDouble className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/50">
                    Stay
                  </div>
                  <div className="text-foreground">{d.stayType}</div>
                </div>
              </div>
            )}
            {d.accessibility && (
              <div className="flex items-start gap-2">
                <Accessibility className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/50">
                    Accessibility
                  </div>
                  <div className="text-foreground">{d.accessibility}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function DayGallery({ day, location, images }: { day: number; location: string; images: string[] }) {
  return (
    <Carousel opts={{ align: "start", loop: true }} className="mt-7 px-0">
      <CarouselContent className="-ml-0">
        {images.map((src, i) => (
          <CarouselItem key={`${src}-${i}`} className="basis-full pl-0">
            <div className="h-[48vh] min-h-[300px] w-full overflow-hidden rounded-xl md:h-[62vh] md:min-h-[480px] md:rounded-2xl">
              <img
                src={src}
                alt={`Day ${day} in ${location}, scene ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4 border-border bg-background/90 text-primary hover:bg-background" />
      <CarouselNext className="right-4 border-border bg-background/90 text-primary hover:bg-background" />
    </Carousel>
  );
}

function DayBlock({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items?: string[];
}) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/60">
        <span className="text-accent">{icon}</span> {title}
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            className="text-[15px] text-foreground/85 leading-snug flex gap-2"
          >
            <span className="mt-2 h-1 w-1 rounded-full bg-accent shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DayParagraph({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text?: string;
}) {
  if (!text) return null;
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/60">
        <span className="text-accent">{icon}</span> {title}
      </div>
      <p className="mt-3 text-[15px] text-foreground/85 leading-relaxed">{text}</p>
    </div>
  );
}

/* ---------------- Inclusions / Exclusions ---------------- */
const DEFAULT_INCLUSIONS = [
  "Handpicked boutique & luxury stays with daily breakfast",
  "Private airport transfers and inter-city transportation",
  "English-speaking local guides for all curated experiences",
  "Entrance fees & permits for listed attractions",
  "Signature QARWAAN moments and tastings as per itinerary",
  "24/7 on-trip concierge support",
];
const DEFAULT_EXCLUSIONS = [
  "International flights to/from the destination",
  "Visa fees, travel insurance, and vaccinations",
  "Lunches & dinners unless specified in the itinerary",
  "Personal expenses, tipping, and beverages",
  "Optional experiences and upgrades",
  "Anything not explicitly listed under inclusions",
];

function InclusionsExclusions({ trip }: { trip: TripDetail }) {
  const inc = trip.inclusions && trip.inclusions.length > 0 ? trip.inclusions : DEFAULT_INCLUSIONS;
  const exc = trip.exclusions && trip.exclusions.length > 0 ? trip.exclusions : DEFAULT_EXCLUSIONS;
  return (
    <section className="bg-card/40 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <SectionLabel>The Fine Print</SectionLabel>
        <h2 className="mt-3 font-serif text-3xl md:text-4xl text-primary">
          What's Included & What's Not
        </h2>
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-background border border-border p-7 md:p-8">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Check className="h-4 w-4" />
              </span>
              Inclusions
            </div>
            <ul className="mt-5 space-y-3">
              {inc.map((item, i) => (
                <li key={i} className="flex gap-3 text-[15px] text-foreground/85 leading-relaxed">
                  <Check className="mt-0.5 h-4 w-4 text-accent shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-background border border-border p-7 md:p-8">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <X className="h-4 w-4" />
              </span>
              Exclusions
            </div>
            <ul className="mt-5 space-y-3">
              {exc.map((item, i) => (
                <li key={i} className="flex gap-3 text-[15px] text-foreground/70 leading-relaxed">
                  <X className="mt-0.5 h-4 w-4 text-foreground/40 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- How It Works ---------------- */
const DEFAULT_HOW_IT_WORKS = [
  {
    title: "Share your vision",
    description:
      "Tell us your travel dates, pace, and what you love — a QARWAAN designer picks up the brief within 24 hours.",
  },
  {
    title: "Receive a tailored proposal",
    description:
      "We craft a day-by-day itinerary with handpicked stays, private guides, and signature experiences — refined until it's yours.",
  },
  {
    title: "Confirm & prepare",
    description:
      "Secure your journey with a deposit. We handle bookings, permits, and pre-trip briefings so you can pack light.",
  },
  {
    title: "Travel with us",
    description:
      "Enjoy seamless on-ground execution with 24/7 concierge support — one message and we're on it, anywhere in the world.",
  },
];

function HowItWorks({ trip }: { trip: TripDetail }) {
  const steps =
    trip.howItWorks && trip.howItWorks.length > 0 ? trip.howItWorks : DEFAULT_HOW_IT_WORKS;
  const icons = [MessageSquare, ClipboardList, Compass, Plane];
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
      <SectionLabel>How It Works</SectionLabel>
      <h2 className="mt-3 font-serif text-3xl md:text-4xl text-primary">
        From enquiry to arrival
      </h2>
      <p className="mt-4 max-w-2xl text-foreground/70">
        Every QARWAAN journey follows a simple, personal process — no forms, no
        templates, just a designer who listens.
      </p>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((step, i) => {
          const Icon = icons[i % icons.length];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="relative rounded-2xl border border-border bg-background p-6 md:p-7"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-serif text-2xl text-accent">
                  0{i + 1}
                </div>
              </div>
              <h3 className="mt-5 font-serif text-lg text-primary leading-snug">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- CTA Band ---------------- */
function CtaBand({ trip }: { trip: TripDetail }) {
  return (
    <section className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
        <div>
          {/* <SectionLabel className="text-accent">Ready to begin?</SectionLabel> */}
          <h2 className="mt-3 font-serif text-3xl md:text-5xl leading-tight">
            Make {trip.packageName} yours.
          </h2>
          <p className="mt-5 max-w-xl text-secondary-foreground/80">
            Speak with a QARWAAN trip designer and shape every day around the way
            you travel. No templates, no fillers — just your journey.
          </p>
        </div>
        <div className="md:justify-self-end flex flex-col items-start gap-3">
          <Link
            to="/enquire"
            search={{ trip: trip.packageName }}
            className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-7 py-3.5 text-sm font-medium hover:bg-accent/90 transition"
          >
            Enquire Now <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Sticky mobile enquire ---------------- */
function StickyEnquire({ trip }: { trip: TripDetail }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur p-3">
      <Link
        to="/enquire"
        search={{ trip: trip.packageName }}
        className="flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground py-3 text-sm font-medium"
      >
        Enquire About This Trip <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* ---------------- Bits ---------------- */
function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-[11px] uppercase tracking-[0.35em] text-accent ${className}`}
    >
      {children}
    </div>
  );
}

function TripSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-[80vh] w-full bg-muted animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 space-y-6">
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ArrowUpRight,
  CalendarCheck,
  Star,
  Headphones,
  Ticket,
  Quote,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import patagonia from "@/assets/dest-patagonia.jpg";
import heroImage from "../../hero-image.png";
import t1 from "@/assets/testimonial-1.jpg";
import t2 from "@/assets/testimonial-2.jpg";
import t3 from "@/assets/testimonial-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QARWAAN — Travel Beyond The Expected" },
      {
        name: "description",
        content:
          "QARWAAN crafts effortless, personal journeys to the world's most iconic and hidden places.",
      },
      { property: "og:title", content: "QARWAAN — Travel Beyond The Expected" },
      {
        property: "og:description",
        content: "Curated luxury journeys, designed around you.",
      },
      { property: "og:image", content: heroImage },
    ],
  }),
  component: Home,
});

const NAV: { label: string; to: string }[] = [
  { label: "Destinations", to: "/trips" },
  { label: "Weekend Getaways", to: "/weekend-getaways" },
  { label: "About Us", to: "/about-us" },
];

const TRIP_IMAGES = {
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1800&q=85",
  kerala: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1800&q=85",
  ladakh: "/images/ladakh-cover.png",
  rajasthan: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1800&q=85",
  spiti: "/images/spiti-cover.png",
};

const DESTINATIONS = [
  { name: "Goa", country: "India", region: "Goa", img: TRIP_IMAGES.goa, tag: "Coast & Culture", slug: "goa-coastal-charm-cultural-escape" },
  { name: "Kerala", country: "India", region: "Kerala", img: TRIP_IMAGES.kerala, tag: "Serenity Escape", slug: "kerala-serenity-escape" },
  { name: "Ladakh", country: "India", region: "Ladakh", img: TRIP_IMAGES.ladakh, tag: "Himalayan Roads", slug: "ladakh-himalayan-expedition" },
  { name: "Rajasthan", country: "India", region: "Rajasthan", img: TRIP_IMAGES.rajasthan, tag: "Royal Heritage", slug: "rajasthan-royal-heritage-desert-odyssey" },
  { name: "Spiti Valley", country: "India", region: "Himachal Pradesh", img: TRIP_IMAGES.spiti, tag: "High-Altitude Escape", slug: "spiti-valley-expedition" },
];

const PILLARS = [
  {
    icon: CalendarCheck,
    title: "Seamless Planning",
    body: "Seamless end-to-end planning experience.",
  },
  {
    icon: Star,
    title: "Handpicked Details",
    body: "Handpicked stays & experiences.",
  },
  {
    icon: Headphones,
    title: "Always Supported",
    body: "24/7 on-trip support.",
  },
  {
    icon: Ticket,
    title: "Made for You",
    body: "Personalized itineraries.",
  },
];

const EXPERIENCES: { title: string; place: string; country: string; duration: string; img: string; slug: string }[] = [
  { title: "Coastal Charm & Cultural Escape", place: "Goa", country: "India", duration: "6 nights", img: TRIP_IMAGES.goa, slug: "goa-coastal-charm-cultural-escape" },
  { title: "Kerala Serenity Escape", place: "Kerala", country: "India", duration: "6 nights", img: TRIP_IMAGES.kerala, slug: "kerala-serenity-escape" },
  { title: "Ultimate Ladakh Road Journey", place: "Ladakh", country: "India", duration: "6 nights", img: TRIP_IMAGES.ladakh, slug: "ladakh-himalayan-expedition" },
  { title: "Royal Heritage & Desert Odyssey", place: "Rajasthan", country: "India", duration: "10 nights", img: TRIP_IMAGES.rajasthan, slug: "rajasthan-royal-heritage-desert-odyssey" },
  { title: "Spiti Valley – The Himalayan Odyssey", place: "Spiti Valley", country: "India", duration: "6 nights", img: TRIP_IMAGES.spiti, slug: "spiti-valley-expedition" },
];

const WEEKEND_GETAWAYS: { title: string; place: string; country: string; duration: string; img: string; slug: string }[] = [
  { title: "Coastal Charm & Cultural Escape", place: "Goa", country: "India", duration: "6 nights", img: TRIP_IMAGES.goa, slug: "goa-coastal-charm-cultural-escape" },
  { title: "Kerala Serenity Escape", place: "Kerala", country: "India", duration: "6 nights", img: TRIP_IMAGES.kerala, slug: "kerala-serenity-escape" },
  { title: "Ultimate Ladakh Road Journey", place: "Ladakh", country: "India", duration: "6 nights", img: TRIP_IMAGES.ladakh, slug: "ladakh-himalayan-expedition" },
  { title: "Royal Heritage & Desert Odyssey", place: "Rajasthan", country: "India", duration: "10 nights", img: TRIP_IMAGES.rajasthan, slug: "rajasthan-royal-heritage-desert-odyssey" },
  { title: "Spiti Valley – The Himalayan Odyssey", place: "Spiti Valley", country: "India", duration: "6 nights", img: TRIP_IMAGES.spiti, slug: "spiti-valley-expedition" },
];


const TESTIMONIALS = [
  {
    quote:
      "QARWAAN doesn't sell trips — they compose them. Every detail of our month across Japan felt deeply personal, and entirely effortless.",
    name: "Amelia Hart",
    place: "London → Kyoto",
    avatar: t1,
  },
  {
    quote:
      "I've traveled my whole life. This was the first time I felt a company truly understood what I was looking for, and then quietly delivered it.",
    name: "Rajiv Mehra",
    place: "Mumbai → Patagonia",
    avatar: t2,
  },
  {
    quote:
      "Our honeymoon was extraordinary. Doors opened we didn't know existed. We're already planning our return with them.",
    name: "Sofia & Luca",
    place: "Milan → Maldives",
    avatar: t3,
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader page="home" transparentAtTop />
      <Hero />
      <Destinations />
      <WhyQarwaan />
      <Experiences />
      {/* Temporarily hidden */}
      {/* <Testimonials /> */}
      {/* <Newsletter /> */}
      <Faq />
      <SiteFooter />
    </div>
  );
}

/* ---------- Navbar ---------- */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 md:py-5">
        <a
          href="#top"
          className={`font-serif text-2xl tracking-[0.2em] transition-colors ${
            scrolled ? "text-primary" : "text-background"
          }`}
        >
          QARWAAN
        </a>

        <nav className="hidden md:flex items-center gap-10">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              className={`text-sm tracking-wide transition-colors ${
                scrolled
                  ? "text-foreground/80 hover:text-primary"
                  : "text-background/85 hover:text-background"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/enquire"
            className={`group inline-flex items-center gap-1.5 text-sm tracking-wide transition-colors ${
              scrolled ? "text-primary" : "text-background"
            }`}
          >
            Plan Your Journey
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <button
          aria-label="Menu"
          className={`md:hidden ${scrolled ? "text-primary" : "text-background"}`}
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary text-primary-foreground"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-serif text-2xl tracking-[0.2em]">QARWAAN</span>
              <button aria-label="Close" onClick={() => setOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <motion.nav
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.06 } },
              }}
              className="mt-16 flex flex-col gap-6 px-8"
            >
              {NAV.map((n) => (
                <motion.div
                  key={n.label}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <Link
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="font-serif text-4xl"
                  >
                    {n.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <Link
                  to="/enquire"
                  onClick={() => setOpen(false)}
                  className="mt-8 inline-flex items-center gap-2 text-sm tracking-[0.25em] uppercase text-accent"
                >
                  Plan a Journey <ArrowUpRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const searchTrips = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    navigate({ to: "/trips", search: q ? { q } : {} });
  };

  return (
    <section id="top" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      <img
        className="absolute inset-0 h-full w-full object-cover"
        src={heroImage}
        alt="Qarwaan travel experience"
      />

      {/* Cinematic vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-background">

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="mt-6 max-w-5xl font-serif text-5xl leading-[1.05] sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Your Next Adventure
          <br />
          <em className="not-italic text-accent">Starts Here</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-background/85 sm:text-lg"
        >
          Curated group trips, weekend getaways, <br></br>and unforgettable experiences across India.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45 }}
          onSubmit={searchTrips}
          className="relative mt-8 h-14 w-full max-w-xl rounded-full border border-background/35 bg-background/95 shadow-xl shadow-black/20"
        >
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/60" aria-hidden="true" />
          <label className="sr-only" htmlFor="home-trip-search">Search trips</label>
          <input
            id="home-trip-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Where do you want to go?"
            className="h-full w-full rounded-full bg-transparent pl-12 pr-28 text-sm text-primary outline-none placeholder:text-primary/55 sm:pr-32 sm:text-base"
          />
          <button
            type="submit"
            className="absolute bottom-1.5 right-1.5 top-1.5 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Search
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          className="mt-7 flex w-full max-w-xl flex-col items-center gap-4 sm:flex-row sm:justify-between"
        >
          <Link
            to="/trips"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium tracking-[0.15em] uppercase text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-2xl hover:shadow-accent/30"
          >
            Explore Journeys
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            to="/enquire"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-background/40 px-7 py-3.5 text-sm font-medium tracking-[0.15em] uppercase text-background transition-all hover:bg-background/10"
          >
            Plan Your Journey
          </Link>
        </motion.div>
      </div>

      {/* Bottom scroll cue */}
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-background/70"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-10 w-px bg-background/50"
          />
        </div>
      </motion.div> */}
    </section>
  );
}

/* ---------- Section helpers ---------- */

function SectionHeader({
  eyebrow,
  title,
  intro,
  align = "left",
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  align?: "left" | "center";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      <span className="eyebrow text-accent">{eyebrow}</span>
      <h2 className="mt-4 font-serif text-4xl leading-tight text-primary sm:text-5xl md:text-6xl">
        {title}
      </h2>
      {intro && (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {intro}
        </p>
      )}
    </motion.div>
  );
}

/* ---------- Destinations ---------- */

function Destinations() {
  return (
    <section id="destinations" className="relative px-5 py-24 sm:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-end gap-10 md:grid-cols-[1fr_auto]">
          <SectionHeader
            // eyebrow="Featured Destinations"
            title={
              <>
              Itineraries to start <em className="not-italic text-accent">a conversation.</em>
              </>
            }
            intro="Not packages — provocations. Each is a launching point, refined entirely around you."
          />
          <Link
            to="/trips"
            className="group hidden items-center gap-2 self-end text-sm tracking-wide text-primary md:inline-flex"
          >
            View all destinations
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-[10rem_30rem_22rem_22rem]">
          {DESTINATIONS.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.08 }}
              className={
                i === 0
                  ? "lg:col-span-8 lg:row-span-2"
                  : i === 1
                    ? "lg:col-span-4 lg:row-span-2"
                    : i === 2 || i === 3
                      ? "lg:col-span-6"
                      : "lg:col-span-12"
              }
            >
              <Link
                to="/trips/$slug"
                params={{ slug: d.slug }}
                className="group relative block h-full min-h-[300px] overflow-hidden rounded-md"
              >
                <div className="h-full w-full overflow-hidden bg-muted">
                  <img
                    src={d.img}
                    alt={`${d.name}, ${d.region}`}
                    loading="lazy"
                    width={1280}
                    height={1600}
                    className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-background md:p-7">
                  <span className="eyebrow text-accent">{d.tag}</span>
                  <h3 className="mt-2 font-serif text-3xl md:text-4xl">{d.name}</h3>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm text-background/75">{d.region}</span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-background/40 transition-all group-hover:bg-accent group-hover:border-accent group-hover:text-accent-foreground">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Why QARWAAN ---------- */

function WhyQarwaan() {
  return (
    <section id="about" className="relative bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:py-32">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl md:text-6xl">
              Why <em className="not-italic text-accent">Qarwaan</em>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-background/75 sm:text-lg">
              Travel shouldn&apos;t feel like bookings, checklists, and endless planning. It should feel like a story, one that unfolds beautifully, one moment at a time.
            </p>
            <p className="mt-5 max-w-md text-base leading-relaxed text-background/75 sm:text-lg">
              At Qarwaan, we take care of everything behind the scenes, so you can simply experience the journey.
            </p>
            <Link
              to="/enquire"
              className="mt-10 inline-flex items-center gap-2 border-b border-accent pb-1 text-sm tracking-[0.2em] uppercase text-accent"
            >
              Travel with us
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 gap-px bg-background/15 sm:grid-cols-2">
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="bg-primary p-8"
                >
                  <Icon className="h-7 w-7 text-accent" strokeWidth={1.5} />
                  <h3 className="mt-6 font-serif text-2xl">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-background/70">
                    {p.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Experiences ---------- */

function Experiences() {
  return (
    <section id="experiences" className="px-5 py-24 sm:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Signature Experiences"
          title={
            <>
              Where will <em className="not-italic text-accent">you go next ?</em>
            </>
          }
          intro="Explore our curated travel packages and discover where your next journey begins."
        />

        <div className="mt-14">
          <ExperienceCarousel items={EXPERIENCES} idPrefix="signature" />
        </div>

        {/*
        <div className="mt-24">
          <SectionHeader
            eyebrow="Short Escapes"
            title={
              <>
                Weekend <em className="not-italic text-accent">Getaways.</em>
              </>
            }
            intro="Quick, well-composed escapes for when time is short but the craving isn't."
          />
          <div className="mt-14">
            <ExperienceCarousel items={WEEKEND_GETAWAYS} idPrefix="weekend" />
          </div>
        </div>
        */}
      </div>
    </section>
  );
}

function ExperienceCarousel({
  items,
  idPrefix,
}: {
  items: typeof EXPERIENCES;
  idPrefix: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-experience-card]");
    const gap = Number.parseFloat(getComputedStyle(el).gap) || 0;
    const amount = card ? card.offsetWidth + gap : el.clientWidth;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <button
        type="button"
        aria-label={`Previous ${idPrefix} itineraries`}
        onClick={() => scrollBy(-1)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div
        ref={scrollerRef}
        className="flex min-w-0 flex-1 items-stretch snap-x snap-mandatory gap-6 overflow-x-auto overflow-y-hidden scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((e, i) => (
          <motion.div
            key={e.title}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: i * 0.1 }}
            data-experience-card
            className="h-full w-[85%] shrink-0 snap-start sm:w-[48%] md:w-[32%]"
          >
            <Link
              to="/trips/$slug"
              params={{ slug: e.slug }}
              className="group block h-full"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                <img
                  src={e.img}
                  alt={e.title}
                  loading="lazy"
                  width={1280}
                  height={1600}
                  className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05]"
                />
                <div className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-primary">
                  {e.duration}
                </div>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                    {e.place}
                  </span>
                  <h4 className="mt-1 font-serif text-2xl text-primary">{e.title}</h4>
                </div>
                <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <button
        type="button"
        aria-label={`Next ${idPrefix} itineraries`}
        onClick={() => scrollBy(1)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------- Terms & Conditions ---------- */

const TERMS_AND_CONDITIONS = [
  {
    title: "1. Personal Conduct",
    body: "All travellers are expected to behave respectfully towards fellow travellers, trip leaders, local communities, vendors, and accommodation staff. Qarwaan reserves the right to remove any participant whose behaviour is disruptive, abusive, unsafe, or inappropriate. No refund will be provided in such cases.",
  },
  {
    title: "2. Harassment & Personal Responsibility",
    body: "Qarwaan has zero tolerance for verbal, physical, or sexual harassment. Any personal interactions or relationships formed during the trip are solely the responsibility of the individuals involved. Qarwaan is not liable for any consequences arising from personal conduct.",
  },
  {
    title: "3. Adventure Activities & Safety",
    body: "Participation in trekking, water sports, adventure activities, or any optional experiences is entirely at the traveller's own risk. Participants must follow all safety guidelines provided by instructors or trip leaders. Qarwaan will not be responsible for accidents, injuries, or losses arising from such activities.",
  },
  {
    title: "4. Health & Medical Responsibility",
    body: "Travellers are responsible for ensuring they are medically fit to participate in the trip. Any medical treatment, hospitalization, emergency evacuation, or related expenses during the trip shall be borne by the traveller. We strongly recommend purchasing comprehensive travel insurance.",
  },
  {
    title: "5. Travel Insurance",
    body: "Travel insurance is recommended for all domestic trips and mandatory where specified for international departures. Qarwaan is not responsible for any financial loss resulting from medical emergencies, cancellations, delays, or unforeseen incidents.",
  },
  {
    title: "6. Property & Environmental Responsibility",
    body: "Travellers are expected to respect accommodations, transport, public spaces, and natural surroundings. Any damage caused to property or the environment due to negligence or misconduct will be the traveller's responsibility, and applicable charges must be paid directly.",
  },
  {
    title: "7. Drugs, Alcohol & Smoking",
    body: "Possession or consumption of illegal drugs or narcotics is strictly prohibited. Qarwaan is not responsible for any legal or personal consequences arising from substance abuse. Alcohol consumption, where permitted, must always be responsible and must not disrupt the experience of others.",
  },
  {
    title: "8. Punctuality & Missed Services",
    body: "Travellers must report to pickup points at least 30 minutes before the scheduled departure time. Qarwaan is not responsible for missed departures, transfers, activities, or services due to late arrival by the traveller. No refunds will be issued for missed inclusions.",
  },
  {
    title: "9. Booking & Payment",
    body: "Full payment must be completed before the trip departure unless otherwise communicated. A valid government-issued ID is mandatory for all travellers. For international trips, passports must be valid for at least six (6) months from the date of travel. Bookings are non-transferable unless approved by Qarwaan. No refunds will be provided for unused services or inclusions.",
  },
  {
    title: "10. Itinerary Changes",
    body: "Trip itineraries may change due to weather conditions, road closures, operational requirements, government regulations, or unforeseen circumstances. Qarwaan will make reasonable efforts to provide suitable alternatives wherever possible.",
  },
  {
    title: "11. Force Majeure",
    body: "Qarwaan shall not be held responsible for delays, cancellations, or changes caused by events beyond its control, including but not limited to natural disasters, extreme weather, political unrest, pandemics, strikes, government restrictions, or other force majeure events. Any additional costs arising from such situations shall be borne by the traveller.",
  },
  {
    title: "12. Personal Belongings",
    body: "Travellers are solely responsible for their luggage, passports, electronics, cash, and other personal belongings throughout the trip. Qarwaan is not liable for any loss, theft, or damage to personal property.",
  },
  {
    title: "13. Photography & Content Usage",
    body: "Photos and videos captured by Qarwaan or its representatives during the trip may be used for marketing, promotional, and social media purposes. By joining a Qarwaan trip, travellers grant permission for such usage unless they inform us otherwise before the trip begins.",
  },
  {
    title: "14. Transportation Guidelines",
    body: "Air conditioning may be switched off in hilly areas or when required for vehicle safety. Seating arrangements are subject to operational requirements. Drivers and trip leaders have the authority to make decisions related to passenger safety.",
  },
  {
    title: "15. Cancellation Due to Misconduct",
    body: "Qarwaan reserves the right to terminate a traveller's participation if their behaviour threatens the safety, comfort, or well-being of others. Any additional travel, accommodation, or return expenses resulting from such removal shall be borne entirely by the traveller.",
  },
  {
    title: "16. Liability",
    body: "Qarwaan acts solely as a travel organiser and facilitator. While every effort is made to ensure a safe and enjoyable experience, Qarwaan shall not be liable for personal injury, illness, loss, theft, delays, cancellations, or damages arising from circumstances beyond its reasonable control or due to the traveller's own actions.",
  },
  {
    title: "17. Acceptance of Terms",
    body: "By confirming a booking with Qarwaan, the traveller acknowledges that they have read, understood, and agreed to these Terms & Conditions and agree to comply with all instructions provided by Qarwaan and its trip leaders throughout the journey.",
  },
];

function TermsAndConditions() {
  return (
    <section id="terms-and-conditions" className="bg-primary px-5 py-24 text-primary-foreground sm:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="font-serif text-4xl font-medium tracking-tight text-primary-foreground sm:text-5xl md:text-6xl">
            Qarwaan Terms & Conditions
          </h2>
          <div className="mx-auto mt-3 h-px w-40 bg-accent" />
          <p className="mt-6 text-base text-background/70 sm:text-lg">
            Please read these terms carefully before joining a Qarwaan trip.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-x-16 gap-y-10 md:mt-20 md:grid-cols-2 md:gap-y-12 lg:gap-x-24">
          {TERMS_AND_CONDITIONS.map((point, index) => (
            <motion.article
              key={point.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (index % 2) * 0.08 }}
              className={index === 16 ? "md:col-start-1" : ""}
            >
              <h3 className="font-serif text-2xl font-medium text-accent sm:text-3xl">{point.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-background/70 sm:text-lg">{point.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

const FAQS = [
  {
    question: "Who can travel with Qarwaan?",
    answer: "Qarwaan is designed for young travelers, solo explorers, friends, and groups looking for fun, well-planned, and community-driven travel experiences.",
  },
  {
    question: "Are the trips safe for solo travellers?",
    answer: "Yes. Our trips are carefully planned with verified accommodations, experienced trip leaders, and a strong focus on safety, making them ideal for solo travellers as well.",
  },
  {
    question: "What is included in the trip package?",
    answer: "Package inclusions vary by trip but generally cover accommodation, transportation, selected meals, guided experiences, and a dedicated trip captain. Check the itinerary for complete details.",
  },
  {
    question: "Can I book a trip with my friends?",
    answer: "Absolutely! Whether you're travelling solo, with a partner, or as a group, you can book your trip and enjoy the experience together.",
  },
  {
    question: "How do I book a trip?",
    answer: "Simply browse our upcoming trips, choose your destination, and complete your booking through our website. If you need help, our team is always happy to assist.",
  },
];

function Faq() {
  return (
    <section id="faq" className="border-t border-[#004643]/10 bg-background px-5 py-24 sm:px-8 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
        >
          {/* <span className="eyebrow text-accent">Need to know</span> */}
          <h2 className="mt-4 font-serif text-4xl leading-tight text-primary sm:text-5xl md:text-6xl">
            Frequently asked <em className="not-italic text-accent">questions.</em>
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Everything you need before joining the journey. Still curious? We would love to hear from you.
          </p>
          <Link to="/contact" className="mt-8 inline-flex items-center gap-2 border-b border-accent pb-1 text-sm tracking-[0.16em] uppercase text-primary">
            Ask us anything <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="border-t border-primary/20">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`} className="border-primary/20">
                <AccordionTrigger className="py-6 font-serif text-xl font-medium text-primary hover:no-underline sm:text-2xl">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}


/* ---------- Testimonials ---------- */

function Testimonials() {
  const [i, setI] = useState(0);
  const total = TESTIMONIALS.length;

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % total), 7000);
    return () => clearInterval(id);
  }, [total]);

  const t = TESTIMONIALS[i];

  return (
    <section className="relative bg-secondary px-5 py-24 sm:px-8 md:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <span className="eyebrow text-accent">Travelers</span>
        <Quote className="mx-auto mt-6 h-8 w-8 text-accent" strokeWidth={1.5} />

        <div className="relative mt-8 min-h-[260px] sm:min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.55 }}
              className="px-2"
            >
              <p className="font-serif text-2xl leading-snug text-primary sm:text-3xl md:text-4xl">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-10 flex items-center justify-center gap-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  loading="lazy"
                  width={64}
                  height={64}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div className="text-left">
                  <div className="font-serif text-lg text-primary">{t.name}</div>
                  <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                    {t.place}
                  </div>
                </div>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            aria-label="Previous"
            onClick={() => setI((v) => (v - 1 + total) % total)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-8 bg-primary" : "w-4 bg-primary/25"
                }`}
              />
            ))}
          </div>
          <button
            aria-label="Next"
            onClick={() => setI((v) => (v + 1) % total)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Newsletter ---------- */

function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section
      id="newsletter"
      className="relative isolate overflow-hidden px-5 py-24 sm:px-8 md:py-32"
    >
      <img
        src={patagonia}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-black/80" />

      <div className="mx-auto max-w-2xl text-center text-background">
        <span className="eyebrow text-accent">The Dispatch</span>
        <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl md:text-6xl">
          Dispatches from <em className="not-italic text-accent">elsewhere.</em>
        </h2>
        <p className="mt-5 text-base leading-relaxed text-background/80 sm:text-lg">
          A quiet letter, once a month. New journeys, hidden places, and the
          occasional travel essay. No noise.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) setSent(true);
          }}
          className="mx-auto mt-10 flex w-full max-w-lg flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 rounded-full border border-background/30 bg-background/10 px-5 py-3.5 text-sm text-background placeholder:text-background/60 backdrop-blur-md outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium tracking-[0.15em] uppercase text-accent-foreground transition-all hover:bg-accent/90"
          >
            {sent ? "Subscribed" : "Subscribe"}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-4 text-xs tracking-wide text-background/60">
          We respect your inbox. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Calendar,
  Compass,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Trip = {
  id: string;
  name: string;
  country: string;
  cover: string;
  durationDays: number;
  cities: string[];
  bestSeason: string;
  startingPoint: string;
  tripType: string;
  budget: number;
  idealFor: string;
  popularity: number;
};

type TripsResponse = {
  items: Trip[];
  total: number;
  page: number;
  pageSize: number;
  facets: {
    countries: string[];
    tripTypes: string[];
    seasons: string[];
    idealFor: string[];
  };
};

export const Route = createFileRoute("/trips/")({
  validateSearch: (s: Record<string, unknown>) => ({
    destination: typeof s.destination === "string" ? s.destination : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Trips — QARWAAN" },
      {
        name: "description",
        content:
          "Browse QARWAAN's curated journeys. Filter by country, trip type, duration, season and budget.",
      },
      { property: "og:title", content: "Trips — QARWAAN" },
      {
        property: "og:description",
        content: "Discover curated luxury journeys across the world.",
      },
    ],
  }),
  component: TripsPage,
});

const PAGE_SIZE = 6;
const DURATION_OPTIONS = [
  { value: "", label: "Any duration" },
  { value: "short", label: "Up to 5 days" },
  { value: "medium", label: "6–9 days" },
  { value: "long", label: "10+ days" },
];
const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "duration", label: "Duration" },
  { value: "price", label: "Price" },
];
const BUDGET_BANDS = [
  { value: "any", label: "Any budget", min: 0, max: 100000 },
  { value: "lt3k", label: "Under ₹3,000", min: 0, max: 2999 },
  { value: "3to5", label: "₹3,000–₹5,000", min: 3000, max: 5000 },
  { value: "gt5k", label: "₹5,000+", min: 5001, max: 100000 },
];

function TripsPage() {
  const { destination, q: initialQuery } = Route.useSearch();
  const [q, setQ] = useState(initialQuery ?? "");
  const [qDebounced, setQDebounced] = useState(initialQuery ?? "");
  const [country, setCountry] = useState(destination ?? "");
  const [tripType, setTripType] = useState("");
  const [duration, setDuration] = useState("");
  const [bestSeason, setBestSeason] = useState("");
  const [idealFor, setIdealFor] = useState("");
  const [budgetBand, setBudgetBand] = useState("any");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (destination) setCountry(destination);
  }, [destination]);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [qDebounced, country, tripType, duration, bestSeason, idealFor, budgetBand, sort]);

  const budget = BUDGET_BANDS.find((b) => b.value === budgetBand)!;

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (qDebounced) p.set("q", qDebounced);
    if (country) p.set("country", country);
    if (tripType) p.set("tripType", tripType);
    if (duration) p.set("duration", duration);
    if (bestSeason) p.set("bestSeason", bestSeason);
    if (idealFor) p.set("idealFor", idealFor);
    p.set("minBudget", String(budget.min));
    p.set("maxBudget", String(budget.max));
    p.set("sort", sort);
    p.set("page", String(page));
    p.set("pageSize", String(PAGE_SIZE));
    return p.toString();
  }, [qDebounced, country, tripType, duration, bestSeason, idealFor, budget, sort, page]);

  const { data, isLoading, isFetching, isError } = useQuery<TripsResponse>({
    queryKey: ["trips", params],
    queryFn: async () => {
      const res = await fetch(`/api/public/trips?${params}`);
      if (!res.ok) throw new Error("Failed to load trips");
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  const facets = data?.facets;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const activeFilters = [
    q && { label: `Search: “${q}”`, clear: () => setQ("") },
    country && { label: country, clear: () => setCountry("") },
    tripType && { label: tripType, clear: () => setTripType("") },
    duration && {
      label: DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? "",
      clear: () => setDuration(""),
    },
    bestSeason && { label: bestSeason, clear: () => setBestSeason("") },
    idealFor && { label: idealFor, clear: () => setIdealFor("") },
    budgetBand !== "any" && {
      label: budget.label,
      clear: () => setBudgetBand("any"),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAll = () => {
    setCountry("");
    setTripType("");
    setDuration("");
    setBestSeason("");
    setIdealFor("");
    setBudgetBand("any");
    setQ("");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader page="destinations" />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex items-center justify-end gap-3">
            <label className="relative">
              <span className="sr-only">Sort trips</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none rounded-full border border-border bg-card px-5 py-2.5 pr-10 text-sm outline-none transition focus:border-accent"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort: {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm transition hover:border-primary"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters.length > 0 && (
                <span className="-mr-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>

          <div className="relative mt-8">
            <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/45" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search destinations, cities, countries..."
              className="w-full rounded-full border border-border bg-card py-5 pl-14 pr-32 text-base outline-none transition focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setQDebounced(q.trim())}
              className="absolute right-2 top-2 bottom-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Search
            </button>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter, index) => (
                <button
                  key={`${filter.label}-${index}`}
                  onClick={filter.clear}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary"
                >
                  {filter.label} <X className="h-3 w-3" />
                </button>
              ))}
              <button onClick={clearAll} className="ml-1 text-sm text-accent underline underline-offset-4">
                Clear all filters
              </button>
            </div>
          )}
        </motion.div>

        {/* Results */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 mb-8">
            <p className="font-serif text-3xl text-primary">
              {isLoading ? "Loading..." : `${data?.total ?? 0} journeys found`}
              {isFetching && !isLoading && " · updating"}
            </p>
            {!isLoading && <p className="text-sm text-foreground/60">Showing {data?.items.length ?? 0} of {data?.total ?? 0} journeys</p>}
          </div>

          {isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              Failed to load trips. Please try again.
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border h-[420px] animate-pulse" />
              ))}
            </div>
          ) : data && data.items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <p className="font-serif text-2xl text-primary">No journeys match your filters</p>
              <p className="mt-2 text-sm text-foreground/60">Try clearing a filter or broadening your search.</p>
              <button
                onClick={clearAll}
                className="mt-6 inline-flex rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data?.items.map((trip, i) => (
                <TripCard key={trip.id} trip={trip} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.total > PAGE_SIZE && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-card transition"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-9 w-9 rounded-full text-sm transition ${
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-card border border-border"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-card transition"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogContent className="max-h-[85svh] max-w-2xl overflow-y-auto p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl text-primary">Filters</DialogTitle>
            </DialogHeader>

            <div className="grid gap-x-8 sm:grid-cols-2">
              <FilterGroup label="Country">
                <Select value={country} onChange={setCountry} options={facets?.countries ?? []} placeholder="All countries" />
              </FilterGroup>
              <FilterGroup label="Duration">
                <div className="space-y-2">
                  {DURATION_OPTIONS.map((option) => (
                    <Radio key={option.value} name="duration" checked={duration === option.value} onChange={() => setDuration(option.value)} label={option.label} />
                  ))}
                </div>
              </FilterGroup>
              <FilterGroup label="Best Season">
                <div className="grid grid-cols-2 gap-2">
                  {(facets?.seasons ?? []).map((season) => (
                    <Chip key={season} active={bestSeason === season} onClick={() => setBestSeason(bestSeason === season ? "" : season)}>
                      {season}
                    </Chip>
                  ))}
                </div>
              </FilterGroup>
              <FilterGroup label="Budget">
                <div className="space-y-2">
                  {BUDGET_BANDS.map((band) => (
                    <Radio key={band.value} name="budget" checked={budgetBand === band.value} onChange={() => setBudgetBand(band.value)} label={band.label} />
                  ))}
                </div>
              </FilterGroup>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={clearAll} className="rounded-full border border-border px-5 py-3 text-sm transition hover:bg-card">
                Clear filters
              </button>
              <button onClick={() => setFiltersOpen(false)} className="rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground transition hover:bg-primary/90">
                Show {data?.total ?? 0} journeys
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  );
}

function TripCard({ trip, index }: { trip: Trip; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group rounded-2xl bg-card border border-border overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={trip.cover}
          alt={trip.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur px-3 py-1 text-xs">
          <MapPin className="h-3 w-3" /> {trip.country}
        </div>
        <div className="absolute top-3 right-3 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-medium">
          {trip.budget > 0 ? `₹${trip.budget.toLocaleString("en-IN")}` : "Price on request"}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif text-xl text-primary leading-snug">{trip.name}</h3>

        <dl className="mt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-foreground/70 flex-1">
          <Meta icon={<Calendar className="h-3.5 w-3.5" />} label="Duration">
            {trip.durationDays} days
          </Meta>
          <Meta icon={<Compass className="h-3.5 w-3.5" />} label="Best Season">
            {trip.bestSeason}
          </Meta>
          <Meta icon={<MapPin className="h-3.5 w-3.5" />} label="Starts">
            {trip.startingPoint}
          </Meta>
          <Meta icon={<MapPin className="h-3.5 w-3.5" />} label="Cities">
            {trip.cities.join(" · ")}
          </Meta>
        </dl>

        <Link
          to="/trips/$slug"
          params={{ slug: trip.id }}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition group/btn"
        >
          Explore
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </Link>
      </div>
    </motion.article>
  );
}

function Meta({
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
      <dt className="flex items-center gap-1 text-foreground/50 uppercase tracking-wider text-[10px]">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 text-foreground/90">{children}</dd>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-border/60">
      <h4 className="eyebrow text-foreground/60 mb-3">{label}</h4>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Radio({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-[color:var(--accent)]"
      />
      {label}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border hover:border-foreground/40"
      }`}
    >
      {children}
    </button>
  );
}

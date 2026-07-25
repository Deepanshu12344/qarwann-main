import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import kyoto from "@/assets/dest-kyoto.jpg";
import morocco from "@/assets/dest-morocco.jpg";
import patagonia from "@/assets/dest-patagonia.jpg";
import serengeti from "@/assets/dest-serengeti.jpg";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const GETAWAYS = [
  { name: "Backwaters of Alleppey", place: "Kerala", duration: "3 nights", image: kyoto },
  { name: "Leh Heritage Trail", place: "Ladakh", duration: "3 nights", image: patagonia },
  { name: "Jaipur City Palaces", place: "Rajasthan", duration: "2 nights", image: morocco },
  { name: "Munnar Tea Country", place: "Kerala", duration: "3 nights", image: serengeti },
];

export const Route = createFileRoute("/weekend-getaways")({
  head: () => ({
    meta: [
      { title: "Weekend Getaways — QARWAAN" },
      { name: "description", content: "Short, thoughtful escapes for when time is short and the urge to explore is not." },
    ],
  }),
  component: WeekendGetawaysPage,
});

function WeekendGetawaysPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader page="weekends" />

      <section className="border-b border-border/60 px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* <p className="text-[11px] uppercase tracking-[0.32em] text-accent">Short Escapes</p> */}
          <h1 className="mt-5 font-serif text-5xl leading-[0.98] text-primary sm:text-6xl md:text-7xl">
            Go somewhere <em className="not-italic text-accent">this weekend.</em>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A few well-composed days can change everything. Discover quick escapes built for slow mornings, local flavour, and a proper reset.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {/* <p className="text-[11px] uppercase tracking-[0.28em] text-primary/70">Weekend Collection</p> */}
            <h2 className="mt-3 font-serif text-4xl text-primary sm:text-5xl">Small trips. Big stories.</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Choose a starting point, then make it completely your own.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GETAWAYS.map((getaway) => (
            <Link key={getaway.name} to="/enquire" search={{ trip: getaway.name }} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                <img src={getaway.image} alt={getaway.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05]" />
                <div className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">
                  {getaway.duration}
                </div>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{getaway.place}</span>
                  <h3 className="mt-1 font-serif text-2xl leading-tight text-primary">{getaway.name}</h3>
                </div>
                <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-primary px-4 py-16 text-primary-foreground sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent">A quick escape awaits</p>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Leave the ordinary behind.</h2>
          </div>
          <Link to="/enquire" className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium uppercase tracking-[0.15em] text-accent-foreground transition hover:bg-accent/90">
            Plan Your Weekend <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

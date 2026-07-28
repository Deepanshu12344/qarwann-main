import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/weekend-getaways")({
  head: () => ({
    meta: [
      { title: "Weekend Getaways — QARWAAN" },
      { name: "description", content: "Weekend getaways are coming soon at Qarwaan." },
    ],
  }),
  component: WeekendGetawaysPage,
});

function WeekendGetawaysPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader page="weekends" />

      <section className="flex min-h-[calc(100vh-12rem)] items-center px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-7 text-[11px] uppercase tracking-[0.32em] text-accent">Coming Soon</p>
          <h1 className="mt-5 font-serif text-5xl leading-[0.98] text-primary sm:text-6xl md:text-7xl">
            Weekend getaways are <em className="not-italic text-accent">coming soon!</em>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Explore beautiful destinations with Qarwaan, all at budget-friendly prices.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

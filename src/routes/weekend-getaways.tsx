import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/weekend-getaways")({
  head: () => ({
    meta: [
      { title: "Weekend Getaways — QARWAAN" },
      { name: "description", content: "Discover Qarwaan's curated weekend getaways." },
    ],
    links: [{ rel: "canonical", href: "https://qarwaan.com/weekend-getaways" }],
  }),
  component: WeekendGetawaysPage,
});

function WeekendGetawaysPage() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
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
            {/* <p className="text-[11px] uppercase tracking-[0.32em] text-accent">Short Escapes</p> */}
            <h1 className="mt-4 font-serif text-5xl leading-[0.98] text-primary sm:text-6xl md:text-7xl">
              Weekend <em className="not-italic text-accent">Getaways.</em>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Quick, well-composed escapes for when time is short but the craving isn't.
            </p>
          </div>

          <div className="mt-14 flex items-center gap-3 sm:gap-4">
            <button type="button" aria-label="Previous weekend getaways" onClick={() => scrollBy(-1)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div ref={scrollerRef} className="flex min-w-0 flex-1 items-stretch snap-x snap-mandatory gap-6 overflow-x-auto overflow-y-hidden scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }} data-getaway-card className="h-full w-[85%] shrink-0 snap-start sm:w-[48%] md:w-[32%]">
                <Link to="/trips/$slug" params={{ slug: "rishikesh-reset-by-the-ganga-weekend-escape" }} className="group block h-full">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                    <img src="https://images.unsplash.com/photo-1609920658906-8223bd289001?auto=format&fit=crop&w=1800&q=85" alt="Rishikesh beside the Ganga" loading="lazy" width={1280} height={1600} className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05]" />
                    <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-primary">2 nights</span>
                    <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase text-accent-foreground">On Request</span>
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Rishikesh</span>
                      <h2 className="mt-1 font-serif text-2xl text-primary">Reset by the Ganga</h2>
                    </div>
                    <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground"><ArrowUpRight className="h-4 w-4" /></span>
                  </div>
                </Link>
              </motion.div>
            </div>
            <button type="button" aria-label="Next weekend getaways" onClick={() => scrollBy(1)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

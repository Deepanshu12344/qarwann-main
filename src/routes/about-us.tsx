import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Compass, Heart, Users } from "lucide-react";
import { motion } from "framer-motion";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const FOUNDERS = [
  {
    name: "Founder 1",
    role: "Co-Founder",
    intro: "The creative force shaping the Qarwaan experience from the first idea to the last memory.",
  },
  {
    name: "Founder 2",
    role: "Co-Founder",
    intro: "Bringing an eye for detail and a belief that the best journeys feel entirely personal.",
  },
  {
    name: "Founder 3",
    role: "Co-Founder",
    intro: "Building a community around curiosity, culture, and the stories travel leaves with us.",
  },
];

export const Route = createFileRoute("/about-us")({
  head: () => ({
    meta: [
      { title: "About Qarwaan — India's New Age Youth Travel Brand" },
      { name: "description", content: "Meet Qarwaan, a travel brand creating culture-led experiences and unforgettable memories." },
    ],
  }),
  component: AboutUsPage,
});

function AboutUsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader page="about" />

      <section className="px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl text-center"
        >
          {/* <p className="text-[11px] uppercase tracking-[0.34em] text-accent">About Qarwaan</p> */}
          <h1 className="mt-5 font-serif text-5xl leading-[0.95] text-primary sm:text-6xl md:text-7xl">
            India&apos;s New Age <em className="not-italic text-accent">Youth Travel Brand</em>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Travel isn&apos;t a checkbox. It&apos;s culture.
          </p>
        </motion.div>
      </section>

      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-20 md:py-24 lg:px-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">Our Point of View</p>
            <h2 className="mt-5 font-serif text-4xl leading-tight text-primary sm:text-5xl">
              The story lives between departure and arrival.
            </h2>
          </div>
          <div className="space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <p>
              At Qarwaan, we create experiences that go beyond destinations. Every trip is thoughtfully designed to bring together adventure, connection, and unforgettable memories.
            </p>
            <p>
              From mountains and beaches to hidden gems, we believe the best journeys are the ones that change the way you see the world.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="max-w-2xl">
          {/* <p className="text-[11px] uppercase tracking-[0.3em] text-accent">What We Believe</p> */}
          <h2 className="mt-4 font-serif text-4xl leading-tight text-primary sm:text-5xl">Minimal. Bold. Unforgettable.</h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Travel has the power to transform perspectives, build meaningful connections, and inspire change. That&apos;s why we focus on immersive experiences, authentic local culture, and a community of like-minded travelers who share a love for exploring.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden border border-border/70 bg-border/70 md:grid-cols-3">
          <Belief icon={Compass} title="Go deeper" text="Experiences built around the local rhythm, not the usual checklist." />
          <Belief icon={Heart} title="Feel connected" text="Travel designed to make room for the people, places, and moments that matter." />
          <Belief icon={Users} title="Find your people" text="A community of curious travellers who come for the journey and stay for the stories." />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 md:py-28 lg:px-8">
        {/* <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Join the Qarwaan Community</p> */}
        <h2 className="mt-4 font-serif text-4xl leading-tight text-primary sm:text-5xl">Your next adventure starts here.</h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Whether you&apos;re travelling solo or with friends, Qarwaan is here to help you explore more than just destinations. We&apos;re here to create stories you&apos;ll remember long after the journey ends.
        </p>
        <Link to="/enquire" className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-primary/90">
          Plan Your Journey <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}

function Belief({ icon: Icon, title, text }: { icon: typeof Compass; title: string; text: string }) {
  return (
    <div className="bg-background p-8">
      <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
      <h3 className="mt-6 font-serif text-2xl text-primary">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}





// <section className="bg-primary px-4 py-20 text-primary-foreground sm:px-6 md:py-28 lg:px-8">
//         <div className="mx-auto max-w-7xl">
//           {/* <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Meet the Founders</p> */}
//           <h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">The people behind the journeys.</h2>
//           <div className="mt-12 grid gap-8 md:grid-cols-3">
//             {FOUNDERS.map((founder) => (
//               <article key={founder.name}>
//                 <div className="flex aspect-[4/5] items-center justify-center border border-background/20 bg-background/5">
//                   <span className="text-[10px] uppercase tracking-[0.28em] text-background/50">Founder photo</span>
//                 </div>
//                 <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-accent">{founder.role}</p>
//                 <h3 className="mt-2 font-serif text-3xl">{founder.name}</h3>
//                 <p className="mt-3 max-w-sm text-sm leading-relaxed text-background/70">{founder.intro}</p>
//               </article>
//             ))}
//           </div>
//         </div>
//       </section>
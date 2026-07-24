import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};

export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader page="legal" />

      <section className="border-b border-border/60 bg-card px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <h1 className="mt-8 font-serif text-5xl leading-none text-primary sm:text-6xl md:text-7xl">
            {title}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        <div className="max-w-5xl space-y-10 md:space-y-12">
          {sections.map((section) => (
            <article key={section.heading}>
              <h2 className="font-serif text-2xl font-semibold text-primary sm:text-3xl">
                {section.heading}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

export const TERMS_AND_CONDITIONS: LegalSection[] = [
  [
    "Personal Conduct",
    "All travellers are expected to behave respectfully towards fellow travellers, trip leaders, local communities, vendors, and accommodation staff. Qarwaan reserves the right to remove any participant whose behaviour is disruptive, abusive, unsafe, or inappropriate. No refund will be provided in such cases.",
  ],
  [
    "Harassment & Personal Responsibility",
    "Qarwaan has zero tolerance for verbal, physical, or sexual harassment. Any personal interactions or relationships formed during the trip are solely the responsibility of the individuals involved. Qarwaan is not liable for any consequences arising from personal conduct.",
  ],
  [
    "Adventure Activities & Safety",
    "Participation in trekking, water sports, adventure activities, or any optional experiences is entirely at the traveller's own risk. Participants must follow all safety guidelines provided by instructors or trip leaders. Qarwaan will not be responsible for accidents, injuries, or losses arising from such activities.",
  ],
  [
    "Health & Medical Responsibility",
    "Travellers are responsible for ensuring they are medically fit to participate in the trip. Any medical treatment, hospitalization, emergency evacuation, or related expenses during the trip shall be borne by the traveller. We strongly recommend purchasing comprehensive travel insurance.",
  ],
  [
    "Travel Insurance",
    "Travel insurance is recommended for all domestic trips and mandatory where specified for international departures. Qarwaan is not responsible for any financial loss resulting from medical emergencies, cancellations, delays, or unforeseen incidents.",
  ],
  [
    "Property & Environmental Responsibility",
    "Travellers are expected to respect accommodations, transport, public spaces, and natural surroundings. Any damage caused to property or the environment due to negligence or misconduct will be the traveller's responsibility, and applicable charges must be paid directly.",
  ],
  [
    "Drugs, Alcohol & Smoking",
    "Possession or consumption of illegal drugs or narcotics is strictly prohibited. Qarwaan is not responsible for any legal or personal consequences arising from substance abuse. Alcohol consumption, where permitted, must always be responsible and must not disrupt the experience of others.",
  ],
  [
    "Punctuality & Missed Services",
    "Travellers must report to pickup points at least 30 minutes before the scheduled departure time. Qarwaan is not responsible for missed departures, transfers, activities, or services due to late arrival by the traveller. No refunds will be issued for missed inclusions.",
  ],
  [
    "Booking & Payment",
    "Full payment must be completed before the trip departure unless otherwise communicated. A valid government-issued ID is mandatory for all travellers. For international trips, passports must be valid for at least six (6) months from the date of travel. Bookings are non-transferable unless approved by Qarwaan. No refunds will be provided for unused services or inclusions.",
  ],
  [
    "Itinerary Changes",
    "Trip itineraries may change due to weather conditions, road closures, operational requirements, government regulations, or unforeseen circumstances. Qarwaan will make reasonable efforts to provide suitable alternatives wherever possible.",
  ],
  [
    "Force Majeure",
    "Qarwaan shall not be held responsible for delays, cancellations, or changes caused by events beyond its control, including but not limited to natural disasters, extreme weather, political unrest, pandemics, strikes, government restrictions, or other force majeure events. Any additional costs arising from such situations shall be borne by the traveller.",
  ],
  [
    "Personal Belongings",
    "Travellers are solely responsible for their luggage, passports, electronics, cash, and other personal belongings throughout the trip. Qarwaan is not liable for any loss, theft, or damage to personal property.",
  ],
  [
    "Photography & Content Usage",
    "Photos and videos captured by Qarwaan or its representatives during the trip may be used for marketing, promotional, and social media purposes. By joining a Qarwaan trip, travellers grant permission for such usage unless they inform us otherwise before the trip begins.",
  ],
  [
    "Transportation Guidelines",
    "Air conditioning may be switched off in hilly areas or when required for vehicle safety. Seating arrangements are subject to operational requirements. Drivers and trip leaders have the authority to make decisions related to passenger safety.",
  ],
  [
    "Cancellation Due to Misconduct",
    "Qarwaan reserves the right to terminate a traveller's participation if their behaviour threatens the safety, comfort, or well-being of others. Any additional travel, accommodation, or return expenses resulting from such removal shall be borne entirely by the traveller.",
  ],
  [
    "Liability",
    "Qarwaan acts solely as a travel organiser and facilitator. While every effort is made to ensure a safe and enjoyable experience, Qarwaan shall not be liable for personal injury, illness, loss, theft, delays, cancellations, or damages arising from circumstances beyond its reasonable control or due to the traveller's own actions.",
  ],
  [
    "Acceptance of Terms",
    "By confirming a booking with Qarwaan, the traveller acknowledges that they have read, understood, and agreed to these Terms & Conditions and agree to comply with all instructions provided by Qarwaan and its trip leaders throughout the journey.",
  ],
].map(([heading, paragraph]) => ({ heading, paragraphs: [paragraph] }));

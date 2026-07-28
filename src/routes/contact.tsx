import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Instagram, Loader2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { submitContact } from "@/lib/formspree";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const ADDRESS = "14th Floor, CD-B1 1402, Ireo Corridors - Gurgaon, 93P9+3WQ, Samrat Mihir Bhoj Rd, Ramgarh, Sector 67, Gurugram, Haryana, Gurugram-122102";
// Keep the map search focused on the office suite, while retaining the full address for visitors.
const MAP_LOCATION = "14th Floor, CD-B1 1402, Ireo Corridors, Sector 67, Gurugram, Haryana 122102";
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_LOCATION)}`;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — QARWAAN" },
      { name: "description", content: "Get in touch with the QARWAAN team for travel advice, trip enquiries, and support." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);

    try {
      await submitContact({
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        message: data.get("message"),
        source: "contact-us",
      });
      form.reset();
      setSubmitted(true);
      toast.success("Message sent", { description: "Our team will get back to you soon." });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Please try again in a moment.";
      toast.error("Couldn't send your message", { description });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader page="contact" />

      <section className="px-5 py-20 text-center sm:px-8 md:py-28">
        <p className="eyebrow text-accent">Contact Us</p>
        <h1 className="mx-auto mt-5 max-w-5xl font-serif text-5xl leading-[0.9] text-primary sm:text-6xl md:text-7xl">
          Get in touch with us.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Have questions about a trip or planning your next getaway? We&apos;re here to help with enquiries, assistance, and travel advice.
        </p>
      </section>

      <section className="bg-primary/[0.045] px-5 py-8 sm:px-8 md:py-12">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="rounded-lg border border-primary/25 bg-background p-6 sm:p-8" aria-label="Contact form">
            <h2 className="font-serif text-3xl text-primary">Send us a message</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Tell us how we can help, and we&apos;ll be in touch shortly.</p>

            {submitted && (
              <div className="mt-6 flex items-center gap-3 rounded-md border border-primary/15 bg-primary/5 p-4 text-sm text-primary">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" /> Your message has been received. Thank you.
              </div>
            )}

            <div className="mt-7 grid gap-5">
              <Field label="Full name" name="name" placeholder="Your full name" required />
              <Field label="Email address" name="email" type="email" placeholder="you@example.com" required />
              <Field label="Contact number" name="phone" type="tel" placeholder="Your phone number" required />
              <label className="grid gap-2 text-sm font-medium text-primary">
                What are you interested in?
                <textarea name="message" required rows={5} placeholder="Share more about what you're interested in" className="w-full resize-y rounded-md border border-primary/30 bg-background px-4 py-3 text-sm font-normal text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" />
              </label>
            </div>

            <button type="submit" disabled={submitting} className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Sending..." : "Submit Request"}
            </button>
          </form>

          <div className="overflow-hidden rounded-lg border border-primary/25 bg-background">
            <div className="grid gap-2 border-b border-primary/20 p-5 sm:grid-cols-2">
              <a href={MAP_URL} target="_blank" rel="noreferrer" className="flex gap-3 rounded-md bg-primary/5 p-3 text-sm leading-relaxed text-primary transition hover:bg-primary/10 sm:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{ADDRESS}</span>
              </a>
              <a href="mailto:team@qarwaan.com" className="flex items-center gap-2 rounded-md bg-primary/5 p-3 text-sm text-primary transition hover:bg-primary/10"><Mail className="h-4 w-4 text-accent" /> team@qarwaan.com</a>
              <a href="https://www.instagram.com/qarwaantravels/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md bg-primary/5 p-3 text-sm text-primary transition hover:bg-primary/10"><Instagram className="h-4 w-4 text-accent" /> Instagram DM</a>
              <a href="tel:+918796162117" className="flex items-center gap-2 rounded-md bg-primary/5 p-3 text-sm text-primary transition hover:bg-primary/10"><Phone className="h-4 w-4 text-accent" /> +91 87961 62117</a>
              <a href="https://wa.me/918796162117" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md bg-primary/5 p-3 text-sm text-primary transition hover:bg-primary/10"><MessageCircle className="h-4 w-4 text-accent" /> Message on WhatsApp</a>
            </div>
            <iframe
              title="Qarwaan office location"
              src={`https://maps.google.com/maps?hl=en&q=${encodeURIComponent(MAP_LOCATION)}&z=18&iwloc=B&output=embed`}
              className="h-[380px] w-full border-0 sm:h-[430px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Field({ label, name, type = "text", placeholder, required = false }: { label: string; name: string; type?: string; placeholder: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-primary">
      {label}
      <input name={name} type={type} placeholder={placeholder} required={required} className="h-11 rounded-md border border-primary/30 bg-background px-4 text-sm font-normal text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20" />
    </label>
  );
}

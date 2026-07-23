import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { submitEnquiry } from "@/lib/formspree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const DESTINATIONS = [
  "Japan",
  "Morocco",
  "Iceland",
  "Italy",
  "Switzerland",
  "Kenya",
  "Ladakh",
  "Spiti",
  "Greece",
  "Australia",
  "Cambodia",
  "Peru",
  "Other",
];

const CURRENCIES = ["INR", "EUR", "GBP", "AED"];
const HEAR_ABOUT = ["Instagram", "Facebook", "Google Search", "Friend / Family", "Blog / Press", "Other"];
const COUNTRY_CODES = ["+91", "+1", "+44", "+61", "+971", "+81", "+33", "+39"];
const TRAVELERS = ["1", "2", "3-4", "5-6", "7-10", "10+"];

const schema = z
  .object({
    destination: z.string().trim().min(1, "Please select a destination"),
    travelDate: z.string().default(""),
    duration: z.string().trim().max(60).default(""),
    budgetCurrency: z.string().default(""),
    budgetAmount: z.string().trim().max(20).default(""),
    travelers: z.string().min(1, "Select travellers"),
    specific: z.string().trim().max(2000).default(""),
    firstName: z.string().trim().min(1, "First name is required").max(60),
    lastName: z.string().trim().max(60).default(""),
    email: z.string().trim().email("Enter a valid email").max(200),
    confirmEmail: z.string().trim().email("Confirm your email").max(200),
    countryCode: z.string().min(1),
    phone: z.string().trim().min(5, "Enter a valid phone number").max(20),
    hearAbout: z.string().default(""),
  })
  .refine((v) => v.email === v.confirmEmail, {
    message: "Emails don't match",
    path: ["confirmEmail"],
  });

type FormValues = z.input<typeof schema>;
type SearchParams = { trip?: string };

export const Route = createFileRoute("/enquire")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    trip: typeof s.trip === "string" ? s.trip : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Plan Your Trip — QARWAAN" },
      {
        name: "description",
        content:
          "You pack. We handle the rest. Answer a few quick questions and a QARWAAN travel designer will design a trip that fits you.",
      },
      { property: "og:title", content: "Plan Your Trip — QARWAAN" },
      {
        property: "og:description",
        content: "Begin a conversation with QARWAAN's travel designers.",
      },
    ],
  }),
  component: EnquirePage,
});

function EnquirePage() {
  const { trip } = useSearch({ from: "/enquire" });
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      destination: trip ?? "",
      travelDate: "",
      duration: "",
      budgetCurrency: "INR",
      budgetAmount: "",
      travelers: "",
      specific: "",
      firstName: "",
      lastName: "",
      email: "",
      confirmEmail: "",
      countryCode: "+91",
      phone: "",
      hearAbout: "",
    },
  });

  // CTA links provide the trip name as /enquire?trip=..., including client-side navigation.
  useEffect(() => {
    if (trip) form.setValue("destination", trip);
  }, [form, trip]);

  async function onSubmit(values: FormValues) {
    try {
      const composedMessage = [
        values.specific,
        values.duration && `Duration: ${values.duration}`,
        (values.budgetAmount || values.budgetCurrency) &&
          `Budget: ${values.budgetCurrency} ${values.budgetAmount}`.trim(),
        values.hearAbout && `Heard about us via: ${values.hearAbout}`,
      ]
        .filter(Boolean)
        .join("\n");

      const travelersNum = Number(values.travelers.split(/[-+]/)[0]) || 1;

      const payload: Record<string, unknown> = {
        name: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
        phone: `${values.countryCode} ${values.phone}`.trim(),
        tripName: values.destination,
        travelers: travelersNum,
        message: composedMessage,
        newsletterOptIn: false,
        source: "plan-your-trip",
      };
      if (values.travelDate) payload.travelStartDate = values.travelDate;

      await submitEnquiry(payload);
      setDone(true);
      toast.success("Enquiry received", {
        description: "A QARWAAN travel designer will reach out within 24 hours.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Please try again in a moment.";
      toast.error("Couldn't send your enquiry", { description: msg });
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader page="enquire" />

      {/* Thin banner */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-3 text-center text-[11px] tracking-[0.35em] uppercase md:px-8">
          Travel Made Simple
        </div>
      </div>

      {/* Headline */}
      <section className="px-4 pb-6 pt-16 md:px-8 md:pt-24">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl text-center font-serif text-3xl uppercase tracking-[0.15em] text-primary sm:text-4xl md:text-5xl lg:text-6xl"
        >
          You Pack. We Handle The Rest.
        </motion.h1>
      </section>

      {done ? (
        <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="font-serif text-3xl text-primary">Thank you.</h2>
            <p className="max-w-md text-muted-foreground">
              Your enquiry has been received. A travel designer will be in touch shortly.
            </p>
            <Link
              to="/trips"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Explore more journeys
            </Link>
          </div>
        </section>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
          {/* Trip questions card */}
          <div className="rounded-md bg-card p-6 md:p-10">
            <p className="mb-8 text-[11px] uppercase tracking-[0.3em] text-primary/80">
              Answer these few quick questions and we&apos;ll design a trip that fits you
            </p>

            <FieldGroup>
              <Field label="Where would you like to go?" error={form.formState.errors.destination?.message}>
                <select
                  {...form.register("destination")}
                  className={selectCls}
                  defaultValue={trip ?? ""}
                >
                  <option value="">Select destination</option>
                  {DESTINATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            </FieldGroup>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="When would you like to go?">
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" placeholder="Select travel date" {...form.register("travelDate")} className={inputCls} />
                  <Input placeholder="Duration of trip" {...form.register("duration")} className={inputCls} />
                </div>
              </Field>
              <div />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Budget">
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <select {...form.register("budgetCurrency")} className={selectCls}>
                    <option value="">Select currency</option>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <Input placeholder="Budget amount" {...form.register("budgetAmount")} className={inputCls} />
                </div>
              </Field>
              <Field
                label="How many people are travelling?"
                error={form.formState.errors.travelers?.message}
              >
                <select {...form.register("travelers")} className={selectCls}>
                  <option value="">Select a number</option>
                  {TRAVELERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-6">
              <Field label="Tell us anything specific you want for your trip">
                <Textarea
                  rows={5}
                  placeholder="E.g. special occasion, any must-do or don'ts"
                  {...form.register("specific")}
                  className="resize-y bg-background shadow-none"
                />
              </Field>
            </div>
          </div>

          {/* Details card */}
          <div className="mt-8 rounded-md bg-card p-6 md:p-10">
            <p className="mb-8 text-[11px] uppercase tracking-[0.3em] text-primary/80">Details</p>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label={<>Your Name<span className="text-accent">*</span></>} error={form.formState.errors.firstName?.message}>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="First name" {...form.register("firstName")} className={inputCls} />
                  <Input placeholder="Last name" {...form.register("lastName")} className={inputCls} />
                </div>
              </Field>
              <div />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field
                label={<>Email Address<span className="text-accent">*</span></>}
                error={
                  form.formState.errors.email?.message ||
                  form.formState.errors.confirmEmail?.message
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <Input type="email" placeholder="example@email.com" {...form.register("email")} className={inputCls} />
                  <Input type="email" placeholder="Confirm email" {...form.register("confirmEmail")} className={inputCls} />
                </div>
              </Field>
              <div />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label={<>Contact<span className="text-accent">*</span></>} error={form.formState.errors.phone?.message}>
                <div className="grid grid-cols-[90px_1fr] gap-3">
                  <select {...form.register("countryCode")} className={selectCls}>
                    {COUNTRY_CODES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <Input placeholder="Phone number" {...form.register("phone")} className={inputCls} />
                </div>
              </Field>
              <Field label="How did you hear about us?">
                <select {...form.register("hearAbout")} className={selectCls}>
                  <option value="">Select</option>
                  {HEAR_ABOUT.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-10">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="rounded-full bg-primary px-10 py-6 text-xs uppercase tracking-[0.25em] text-primary-foreground hover:bg-primary/90"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>Let&apos;s Go</>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
      <SiteFooter />
    </main>
  );
}

const inputCls =
  "bg-background border-border/70 shadow-none focus-visible:ring-primary/30 placeholder:text-muted-foreground/70";
const selectCls =
  "flex h-10 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm text-foreground shadow-none focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50";

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5">{children}</div>;
}

function Field({
  label,
  error,
  children,
}: {
  label: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] uppercase tracking-[0.22em] text-primary/80">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

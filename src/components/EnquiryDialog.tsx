import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { submitEnquiry } from "@/lib/formspree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().min(5, "Enter a valid phone number").max(40),
  tripName: z.string().trim().max(200),
  travelers: z.coerce.number().int().min(1).max(50),
  travelStartDate: z.string(),
  travelEndDate: z.string(),
  message: z.string().trim().max(2000),
  newsletterOptIn: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export type EnquiryOpenDetail = { tripName?: string };

export const ENQUIRY_OPEN_EVENT = "qarwaan:enquire";

export function openEnquiry(tripName?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<EnquiryOpenDetail>(ENQUIRY_OPEN_EVENT, { detail: { tripName } })
  );
}

export default function EnquiryDialog() {
  const [open, setOpen] = useState(false);
  const [tripName, setTripName] = useState<string>("");
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      tripName: "",
      travelers: 2,
      travelStartDate: "",
      travelEndDate: "",
      message: "",
      newsletterOptIn: false,
    },
  });

  useEffect(() => {
    function onOpen(e: Event) {
      const ce = e as CustomEvent<EnquiryOpenDetail>;
      const tn = ce.detail?.tripName || "";
      setTripName(tn);
      setDone(false);
      form.reset({
        name: "",
        email: "",
        phone: "",
        tripName: tn,
        travelers: 2,
        travelStartDate: "",
        travelEndDate: "",
        message: "",
        newsletterOptIn: false,
      });
      setOpen(true);
    }
    function onDelegatedClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const trigger = target.closest<HTMLElement>(
        "[data-enquire], a[href$='#enquire']"
      );
      if (!trigger) return;
      e.preventDefault();
      const tn =
        trigger.getAttribute("data-trip-name") ||
        trigger.getAttribute("data-enquire") ||
        "";
      openEnquiry(tn && tn !== "true" ? tn : undefined);
    }
    window.addEventListener(ENQUIRY_OPEN_EVENT, onOpen);
    document.addEventListener("click", onDelegatedClick, true);
    return () => {
      window.removeEventListener(ENQUIRY_OPEN_EVENT, onOpen);
      document.removeEventListener("click", onDelegatedClick, true);
    };
  }, [form]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function onSubmit(values: FormValues) {
    try {
      const payload: any = { ...values, source: "website" };
      if (!payload.travelStartDate) delete payload.travelStartDate;
      if (!payload.travelEndDate) delete payload.travelEndDate;
      await submitEnquiry(payload);
      setDone(true);
      toast.success("Enquiry received", {
        description: "Our travel designers will reach out within 24 hours.",
      });
    } catch (err: any) {
      toast.error("Couldn't send your enquiry", {
        description: err?.message || "Please try again in a moment.",
      });
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-primary/60 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-t-2xl bg-background shadow-2xl sm:rounded-2xl"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 text-foreground/70 transition hover:bg-background hover:text-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-primary px-6 py-7 text-primary-foreground sm:px-10 sm:py-8">
              <span className="eyebrow text-accent">Plan Your Journey</span>
              <h2 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">
                {tripName ? (
                  <>
                    Enquire about <em className="not-italic text-accent">{tripName}</em>
                  </>
                ) : (
                  <>
                    Begin a <em className="not-italic text-accent">conversation</em>
                  </>
                )}
              </h2>
              <p className="mt-2 max-w-md text-sm text-background/80">
                Share a few details and a travel designer will reach out within 24
                hours to begin composing your itinerary.
              </p>
            </div>

            {done ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center sm:px-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="font-serif text-2xl text-primary">Thank you.</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Your enquiry has been received. A QARWAAN travel designer will be
                  in touch shortly.
                </p>
                <Button
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                >
                  Close
                </Button>
              </div>
            ) : (
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-7 sm:px-10"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name" error={form.formState.errors.name?.message}>
                    <Input placeholder="Jane Doe" {...form.register("name")} />
                  </Field>
                  <Field label="Email" error={form.formState.errors.email?.message}>
                    <Input type="email" placeholder="you@email.com" {...form.register("email")} />
                  </Field>
                  <Field label="Phone" error={form.formState.errors.phone?.message}>
                    <Input placeholder="+1 555 123 4567" {...form.register("phone")} />
                  </Field>
                  <Field label="Number of Travelers" error={form.formState.errors.travelers?.message}>
                    <Input type="number" min={1} max={50} {...form.register("travelers")} />
                  </Field>
                  <Field label="Trip / Destination">
                    <Input placeholder="e.g. Kyoto in Spring" {...form.register("tripName")} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3 sm:col-span-1">
                    <Field label="From">
                      <Input type="date" {...form.register("travelStartDate")} />
                    </Field>
                    <Field label="To">
                      <Input type="date" {...form.register("travelEndDate")} />
                    </Field>
                  </div>
                </div>

                <Field label="Message">
                  <Textarea
                    rows={4}
                    placeholder="Tell us what you're dreaming about — pace, style, must-sees, special occasions..."
                    {...form.register("message")}
                  />
                </Field>

                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
                  <Checkbox
                    checked={form.watch("newsletterOptIn")}
                    onCheckedChange={(v) => form.setValue("newsletterOptIn", !!v)}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-relaxed text-foreground/80">
                    I would like to receive travel inspiration and exclusive offers
                    from Qarwaan.
                  </span>
                </label>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="rounded-full bg-accent px-7 text-accent-foreground hover:bg-accent/90"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send Enquiry
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-[0.18em] text-foreground/70">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

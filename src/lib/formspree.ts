import { api } from "@/lib/api";

const FORMSPREE_ENQUIRY_ENDPOINT = "https://formspree.io/f/mkopnqaw";

type FormspreeResponse = {
  ok: boolean;
};

/** Sends website enquiries directly to the configured Formspree form. */
export function submitEnquiry(payload: Record<string, unknown>) {
  return api<FormspreeResponse>(FORMSPREE_ENQUIRY_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

import { api } from "@/lib/api";

const FORMSPREE_ENQUIRY_ENDPOINT = "https://formspree.io/f/mkopnqaw";
const FORMSPREE_CONTACT_ENDPOINT = "https://formspree.io/f/xnjeopjl";

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

/** Sends Contact Us messages to the dedicated Formspree form. */
export function submitContact(payload: Record<string, unknown>) {
  return api<FormspreeResponse>(FORMSPREE_CONTACT_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

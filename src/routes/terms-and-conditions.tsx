import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, TERMS_AND_CONDITIONS } from "@/components/LegalPage";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [{ title: "Terms & Conditions — QARWAAN" }, { name: "description", content: "Read Qarwaan's travel booking terms and conditions." }],
    links: [{ rel: "canonical", href: "https://qarwaan.com/terms-and-conditions" }],
  }),
  component: () => <LegalPage title="Terms & Conditions" sections={TERMS_AND_CONDITIONS} />,
});

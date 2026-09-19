import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, TERMS_AND_CONDITIONS } from "@/components/LegalPage";
import { SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [{ title: "Terms & Conditions — QARWAAN" }, { name: "description", content: "Read Qarwaan's travel booking terms and conditions." }, { property: "og:title", content: "Terms & Conditions — QARWAAN" }, { property: "og:description", content: "Read Qarwaan's travel booking terms and conditions." }, { property: "og:url", content: `${SITE_URL}/terms-and-conditions` }],
    links: [{ rel: "canonical", href: `${SITE_URL}/terms-and-conditions` }],
  }),
  component: () => <LegalPage title="Terms & Conditions" sections={TERMS_AND_CONDITIONS} />,
});

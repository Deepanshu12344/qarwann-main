import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, TERMS_AND_CONDITIONS } from "@/components/LegalPage";

export const Route = createFileRoute("/terms-and-conditions")({
  component: () => <LegalPage title="Terms & Conditions" sections={TERMS_AND_CONDITIONS} />,
});

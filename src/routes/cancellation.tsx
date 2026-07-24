import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

const sections: LegalSection[] = [
  {
    heading: "Cancellation Policy",
    paragraphs: [
      "We understand that travel plans can change. However, please review the following cancellation and rescheduling policy carefully before booking your trip with Qarwaan Travels.",
    ],
  },
  {
    heading: "Refund Policy",
    paragraphs: [
      "The initial booking amount paid to confirm your trip is non-refundable in case of cancellation.",
    ],
  },
  {
    heading: "Cancellation Charges",
    paragraphs: [
      "The following cancellation charges will apply based on how far in advance the cancellation is made:",
    ],
    items: [
      "Cancellation made 30 days or more before the trip start date: 50% of the total trip cost will be charged as cancellation fees.",
      "Cancellation made 15–30 days before the trip start date: 75% of the total trip cost will be charged as cancellation fees.",
      "Cancellation made within 0–15 days before the trip start date: 100% of the total trip cost will be charged as cancellation fees.",
    ],
  },
  {
    heading: "Weather & Government Restrictions",
    paragraphs: [
      "In the event of unforeseen weather conditions, natural circumstances, or government restrictions, certain activities or experiences included in the itinerary may be cancelled or modified.",
      "In such situations, Qarwaan Travels will make reasonable efforts to provide an alternative activity or experience wherever feasible. However, no refund will be provided for activities that are cancelled or unavailable due to such circumstances.",
    ],
  },
  {
    heading: "Rescheduling Policy",
    paragraphs: [
      "If a rescheduling request is made within 30 days of the trip start date, the booking amount cannot be adjusted against a future trip date and will not be refunded.",
      "For domestic trips, if a rescheduling request is made more than 30 days before the trip start date, the booking may be rescheduled without cancellation charges, subject to availability and confirmation from the Qarwaan Travels team.",
    ],
  },
  {
    heading: "Contact Us",
    paragraphs: [
      "For any questions regarding cancellations, refunds, or rescheduling, please contact us at:",
      "Email: team@qarwaan.com",
    ],
  },
];

export const Route = createFileRoute("/cancellation")({
  component: () => <LegalPage title="Cancellation" sections={sections} />,
});

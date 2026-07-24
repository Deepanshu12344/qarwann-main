import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

const sections: LegalSection[] = [
  {
    heading: "Overview",
    paragraphs: [
      "At Qarwaan, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website, services, or communicate with us.",
    ],
  },
  {
    heading: "Data We Collect",
    paragraphs: ["We may collect the following information:"],
    items: [
      "Personal Information: Name, email address, phone number, and payment details.",
      "Travel Preferences: Information about your travel interests and preferences to help us provide a more personalized experience.",
      "Website Usage Data: Information such as IP address, browser type, device information, and how you interact with our website.",
      "Communications: Information you provide when you contact us, make an inquiry, or communicate with our team.",
    ],
  },
  {
    heading: "How We Use Your Information",
    paragraphs: ["We may use your information to:"],
    items: [
      "Provide and improve our travel services.",
      "Help personalize your travel experience.",
      "Process bookings and payments.",
      "Respond to your questions and requests.",
      "Send marketing communications, offers, and updates where you have provided consent.",
      "Comply with applicable laws and legal requirements.",
    ],
  },
  {
    heading: "Data Sharing",
    paragraphs: ["We do not sell your personal information. We may share your information:"],
    items: [
      "With trusted service providers who help us deliver our services.",
      "When required by law or legal authorities.",
      "In connection with a merger, acquisition, restructuring, or transfer of business assets.",
    ],
  },
  {
    heading: "Your Rights",
    paragraphs: ["You may have the right to:"],
    items: [
      "Access the personal information we hold about you.",
      "Request corrections to inaccurate or incomplete information.",
      "Request deletion of your personal information, subject to applicable legal requirements.",
      "Opt out of marketing communications at any time.",
    ],
  },
  {
    heading: "Data Security",
    paragraphs: [
      "We use reasonable and industry-standard security measures to protect your personal information from unauthorized access, misuse, alteration, or disclosure. However, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "Contact Us",
    paragraphs: [
      "If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us at:",
      "Email: team@qarwaan.com",
    ],
  },
];

export const Route = createFileRoute("/privacy")({
  component: () => <LegalPage title="Privacy Policy" sections={sections} />,
});

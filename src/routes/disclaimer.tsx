import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

const sections: LegalSection[] = [
  {
    heading: "Website Usage",
    paragraphs: [
      "Qarwaan Travels provides the Qarwaan website and its content as a service to the public and website users.",
      "Qarwaan Travels is not responsible for, and expressly disclaims all liability for, any damages or losses arising from the use of, reference to, or reliance on any information contained on this website. While we make reasonable efforts to keep the information on our website accurate and up to date, we do not guarantee that all information provided is complete, accurate, or current at all times.",
    ],
  },
  {
    heading: "External Links",
    paragraphs: [
      "The Qarwaan Travels website may contain links to third-party websites or other external online resources. Qarwaan Travels is not responsible for the accuracy, reliability, availability, or content of information provided on these external websites.",
      "Links from the Qarwaan website to third-party websites do not constitute an endorsement by Qarwaan Travels of those websites, their owners, products, or services. The appearance of advertisements, products, or service information on our website does not necessarily imply an endorsement or recommendation by Qarwaan Travels.",
    ],
  },
  {
    heading: "Travel Information",
    paragraphs: [
      "All travel-related information provided on the Qarwaan Travels website is intended for general informational and reference purposes only.",
      "Qarwaan Travels does not guarantee the accuracy or completeness of information regarding visa requirements, travel advisories, health warnings, entry requirements, weather conditions, or other government and regulatory requirements, as these may change from time to time.",
      "Travelers are solely responsible for verifying all applicable travel requirements, documentation, visa requirements, and government regulations with the relevant authorities before booking and departing for their trip.",
    ],
  },
  {
    heading: "Image & Asset Usage",
    paragraphs: [
      "Some images, graphics, illustrations, and digital assets displayed on the Qarwaan Travels website may be sourced from third-party platforms and used under applicable licenses. Qarwaan Travels does not claim ownership of such third-party assets, and all rights remain with their respective creators and copyright owners.",
      "These visual elements are used for illustrative and informational purposes only. Their use does not imply any endorsement by the photographers, creators, or third-party platforms.",
      "If you are a copyright owner or creator and believe that your work has been used unintentionally, incorrectly, or without appropriate acknowledgment, you may request its modification or removal by contacting us at:",
      "Email: team@qarwaan.com",
    ],
  },
];

export const Route = createFileRoute("/disclaimer")({
  component: () => <LegalPage title="Disclaimer" sections={sections} />,
});

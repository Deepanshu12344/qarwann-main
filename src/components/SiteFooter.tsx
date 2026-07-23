import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail } from "lucide-react";
import lightLogo from "../../qarwaan-light-logo.png";

type FooterLink = {
  label: string;
  to?: "/trips" | "/weekend-getaways" | "/about-us" | "/enquire";
  href?: string;
};

const footerLinks = {
  explore: [
    { label: "Destinations", to: "/trips" },
    { label: "Weekend Getaways", to: "/weekend-getaways" },
  ],
  company: [
    { label: "About Us", to: "/about-us" },
    { label: "Contact Us", to: "/enquire" },
  ],
  information: [
    { label: "FAQs", href: "/#faq" },
    { label: "Terms & Conditions", href: "/#terms-and-conditions" },
    { label: "team@qarwaan.com", href: "mailto:team@qarwaan.com" },
  ],
} satisfies Record<string, readonly FooterLink[]>;

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <img src={lightLogo} alt="Qarwaan" className="h-16 w-auto object-contain" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-background/70">
              A travel studio crafting effortless, personal journeys to the world's most iconic and hidden corners.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a href="#" aria-label="Instagram" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-background/20 text-background/80 transition-colors hover:border-accent hover:text-accent">
                <Instagram className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="Facebook" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-background/20 text-background/80 transition-colors hover:border-accent hover:text-accent">
                <Facebook className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a href="mailto:team@qarwaan.com" aria-label="Email Qarwaan" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-background/20 text-background/80 transition-colors hover:border-accent hover:text-accent">
                <Mail className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          <FooterCol title="Explore" links={footerLinks.explore} />
          <FooterCol title="Company" links={footerLinks.company} />
          <FooterCol title="Information" links={footerLinks.information} />
        </div>

        <div className="mt-16 hairline" />
        <div className="mt-8 text-xs tracking-wide text-background/60">
          <span>© {new Date().getFullYear()} QARWAAN Travel Studio. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: readonly FooterLink[] }) {
  return (
    <div>
      <h4 className="eyebrow text-accent">{title}</h4>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {link.href ? (
              <a href={link.href} className="text-sm text-background/80 transition-colors hover:text-accent">
                {link.label}
              </a>
            ) : (
              <Link to={link.to!} className="text-sm text-background/80 transition-colors hover:text-accent">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

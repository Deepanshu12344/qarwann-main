import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import darkLogo from "../../qarwaan-dark-logo.png";
import lightLogo from "../../qarwaan-light-logo.png";

type Page = "home" | "destinations" | "weekends" | "about" | "enquire" | "contact" | "legal";

const NAV_ITEMS = {
  home: ["Destinations", "Weekend Getaways", "About Us"],
  destinations: ["Home", "Weekend Getaways", "About Us"],
  weekends: ["Home", "Destinations", "About Us"],
  about: ["Home", "Destinations", "Weekend Getaways"],
  enquire: ["Home", "Destinations", "Weekend Getaways", "About Us"],
  contact: ["Home", "Destinations", "Weekend Getaways", "About Us"],
  legal: ["Home", "Destinations", "Weekend Getaways", "About Us"],
} as const;

const hrefFor = {
  Home: "/",
  Destinations: "/trips",
  "Weekend Getaways": "/weekend-getaways",
  "About Us": "/about-us",
} as const;

export function SiteHeader({ page, transparentAtTop = false }: { page: Page; transparentAtTop?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(!transparentAtTop);
  const links = NAV_ITEMS[page];
  const textColor = scrolled ? "text-primary" : "text-background";
  const linkColor = scrolled ? "text-foreground/80 hover:text-primary" : "text-background/85 hover:text-background";
  const logo = scrolled ? darkLogo : lightLogo;

  useEffect(() => {
    if (!transparentAtTop) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentAtTop]);

  return (
    <header className={`sticky inset-x-0 top-0 z-50 transition-all duration-500 ${transparentAtTop ? "md:fixed" : "border-b border-border/50 bg-background/90 backdrop-blur"} ${scrolled && transparentAtTop ? "border-b border-border bg-background/85 backdrop-blur-md" : ""}`}>
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8 md:h-20">
        <Link to="/" className="justify-self-start">
          <img src={logo} alt="Qarwaan" className="h-10 w-auto object-contain md:h-12" />
        </Link>
        <nav className="hidden items-center justify-center gap-8 lg:flex">
          {links.map((label) => <NavLink key={label} label={label} className={`text-sm tracking-wide transition-colors ${linkColor}`} />)}
        </nav>
        <div className="hidden justify-self-end lg:block">
          {page !== "enquire" && <Link to="/enquire" className={`group inline-flex items-center gap-1.5 text-sm tracking-wide transition-colors ${textColor}`}>Plan Your Journey <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>}
        </div>
        <button aria-label="Open menu" className={`justify-self-end lg:hidden ${textColor}`} onClick={() => setOpen(true)}><Menu className="h-6 w-6" /></button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] bg-primary px-8 py-5 text-primary-foreground">
          <div className="flex items-center justify-between"><img src={lightLogo} alt="Qarwaan" className="h-10 w-auto object-contain" /><button aria-label="Close menu" onClick={() => setOpen(false)}><X className="h-6 w-6" /></button></div>
          <nav className="mt-16 flex flex-col gap-6">
            {links.map((label) => <NavLink key={label} label={label} onClick={() => setOpen(false)} className="font-serif text-4xl" />)}
            {page !== "enquire" && <Link to="/enquire" onClick={() => setOpen(false)} className="mt-4 inline-flex items-center gap-2 text-lg text-accent">Plan Your Journey <ArrowUpRight className="h-5 w-5" /></Link>}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ label, className, onClick }: { label: keyof typeof hrefFor; className: string; onClick?: () => void }) {
  const href = hrefFor[label];
  if (label === "Weekend Getaways") return <a href={href} onClick={onClick} className={className}>{label}</a>;
  return <Link to={href} onClick={onClick} className={className}>{label}</Link>;
}

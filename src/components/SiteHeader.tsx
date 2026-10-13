import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import darkLogo from "../../qarwaan-dark-logo.png";
import lightLogo from "../../qarwaan-light-logo.png";

type Page = "home" | "destinations" | "weekends" | "about" | "enquire" | "contact" | "legal" | "ai";

const NAV_ITEMS = {
  home: ["Destinations", "Weekend Getaways", "Qarwaan AI", "About Us"],
  destinations: ["Home", "Weekend Getaways", "Qarwaan AI", "About Us"],
  weekends: ["Home", "Destinations", "Qarwaan AI", "About Us"],
  about: ["Home", "Destinations", "Weekend Getaways", "Qarwaan AI"],
  enquire: ["Home", "Destinations", "Weekend Getaways", "Qarwaan AI", "About Us"],
  contact: ["Home", "Destinations", "Weekend Getaways", "Qarwaan AI", "About Us"],
  legal: ["Home", "Destinations", "Weekend Getaways", "Qarwaan AI", "About Us"],
  ai: ["Home", "Destinations", "Weekend Getaways", "About Us"],
} as const;

const hrefFor = {
  Home: "/",
  Destinations: "/trips",
  "Weekend Getaways": "/weekend-getaways",
  "Qarwaan AI": "/ai",
  "About Us": "/about-us",
} as const;

export function SiteHeader({ page, transparentAtTop = false }: { page: Page; transparentAtTop?: boolean }) {
  const headerRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("qarwaan:overlay-change", { detail: { open } }),
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <header ref={headerRef} className={`sticky inset-x-0 top-0 z-50 transition-all duration-500 ${transparentAtTop ? "max-md:fixed md:fixed" : "border-b border-border/50 bg-background/90 backdrop-blur"} ${scrolled && transparentAtTop ? "border-b border-border bg-background/85 backdrop-blur-md" : ""}`}>
      <div className="mx-auto grid h-[4.5rem] max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8 md:h-[5.5rem]">
        <Link to="/" className="justify-self-start">
          <img src={logo} alt="Qarwaan" width={240} height={96} className="h-10 w-auto object-contain md:h-12" />
        </Link>
        <nav className="hidden items-center justify-center gap-6 lg:gap-8 md:flex">
          {links.map((label) => <NavLink key={label} label={label} className={`text-sm tracking-wide transition-colors ${linkColor}`} />)}
        </nav>
        <div className="hidden justify-self-end md:flex items-center">
          {page !== "enquire" && <Link to="/enquire" className={`group inline-flex items-center gap-1.5 text-sm tracking-wide transition-colors ${textColor}`}>Plan Your Journey <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>}
        </div>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className={`col-start-3 justify-self-end md:hidden flex items-center justify-center p-2 rounded-lg ${textColor} hover:opacity-80 transition`}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="h-6 w-6 stroke-[1.75]" /> : <Menu className="h-6 w-6 stroke-[1.75]" />}
        </button>
      </div>

      {open && (
        <div className="absolute top-full inset-x-0 z-50 bg-white border-b border-gray-200 shadow-2xl rounded-b-2xl px-6 py-5 text-slate-900 md:hidden">
          <nav className="flex flex-col divide-y divide-gray-100">
            {links.map((label) => (
              <NavLink
                key={label}
                label={label}
                onClick={() => setOpen(false)}
                className="py-3 text-base font-medium text-slate-800 hover:text-[#004643] transition-colors"
              />
            ))}
          </nav>
          {page !== "enquire" && (
            <div className="pt-4 mt-2">
              <Link
                to="/enquire"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#004643] py-3.5 px-6 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#003835] active:scale-[0.99]"
              >
                Plan Your Journey <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          )}
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

"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CloudShader } from "@/components/ui/cloud-shader";
import darkLogo from "../../qarwaan-dark-logo.png";
import lightLogo from "../../qarwaan-light-logo.png";

export default function CloudShaderFlightHeroDemo() {
  const heroRef = useRef<HTMLElement>(null);
  const [pastHero, setPastHero] = useState(false);
  const [scrolledWithinHero, setScrolledWithinHero] = useState(false);

  useEffect(() => {
    const updateHeader = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setPastHero(heroBottom <= 0);
      setScrolledWithinHero(window.scrollY > 24 && heroBottom > 0);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return <section ref={heroRef} id="top" className="relative h-dvh min-h-[40rem] w-full overflow-hidden bg-linear-to-t from-[#8cbfe8] to-[#3876ba]">
    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, ease: "easeOut" }}><div className="absolute h-1/2 w-1/2 origin-top-left scale-200"><CloudShader speed={1} className="absolute inset-0" /></div></motion.div>
    <header className={`fixed inset-x-0 top-0 z-30 transition-colors duration-200 ${pastHero ? "bg-primary backdrop-blur-sm" : scrolledWithinHero ? "bg-white/90 backdrop-blur-sm" : "bg-transparent"}`}><nav className="mx-auto flex min-h-[5rem] w-full max-w-7xl items-center justify-between px-4 py-4 md:min-h-[5.5rem] md:px-8"><Link to="/"><img src={pastHero || !scrolledWithinHero ? lightLogo : darkLogo} alt="Qarwaan" width={240} height={96} className="h-10 w-auto object-contain md:h-12" /></Link><div className={`hidden items-center gap-8 text-sm font-medium md:flex ${scrolledWithinHero && !pastHero ? "text-primary/90" : "text-white/90"}`}><Link to="/trips" className={`transition ${scrolledWithinHero && !pastHero ? "hover:text-primary" : "hover:text-white"}`}>Destinations</Link><Link to="/weekend-getaways" className={`transition ${scrolledWithinHero && !pastHero ? "hover:text-primary" : "hover:text-white"}`}>Weekend Getaways</Link><Link to="/about-us" className={`transition ${scrolledWithinHero && !pastHero ? "hover:text-primary" : "hover:text-white"}`}>About Us</Link></div><Link to="/enquire" className={`inline-flex h-11 w-44 items-center justify-center rounded-full px-6 text-sm font-semibold transition ${scrolledWithinHero && !pastHero ? "bg-primary text-white hover:bg-primary/90" : "bg-white text-black hover:bg-white/90"}`}>Plan a journey</Link></nav></header>
    <div className="relative z-20 mx-auto mt-[4.75rem] w-full max-w-7xl px-4 md:mt-[6.75rem] md:px-8"><div className="max-w-2xl"><h1 className="text-4xl font-bold tracking-tight text-white [text-shadow:0_2px_12px_rgba(15,42,67,0.35)] md:text-6xl">Your next adventure starts here</h1><p className="mt-4 max-w-xl text-base text-balance text-white/85 md:text-lg">Curated group trips, weekend getaways, and unforgettable experiences across India and beyond.</p><div className="mt-8 flex flex-wrap items-center gap-4"><Link to="/trips" className="inline-flex w-44 justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90">Explore journeys</Link><Link to="/enquire" className="inline-flex w-44 justify-center rounded-full border border-white px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black">Plan your journey</Link></div></div></div>
    <motion.div className="pointer-events-none absolute -bottom-6 left-0 z-10 w-[85%] md:w-[70%]" animate={{ y: [0, -12, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}><img src="https://assets.aceternity.com/components/plane-wing.png" alt="Airplane wing above the clouds" className="h-auto w-full object-cover" /></motion.div>
  </section>;
}

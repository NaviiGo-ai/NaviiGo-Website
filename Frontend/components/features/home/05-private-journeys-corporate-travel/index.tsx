"use client";

import React, { useRef } from "react";
import Link from "next/link";
import PlaceImage from "@/components/shared/PlaceImage";
import FullBleed from "@/components/layout/primitives/FullBleed";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PANELS = [
  {
    id: "private",
    href: "/explore",
    title: ["Private", "Journeys"],
    copy: "For individuals, couples and families seeking extraordinary experiences.",
    cta: "Explore Journeys",
    place: { name: "Taj Lake Palace", city: "Udaipur" },
    fallback:
      "https://images.unsplash.com/photo-1599661559132-7667a4dccf69?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: "corporate",
    href: "/support",
    title: ["Corporate", "Travel"],
    copy: "Effortless travel management for executives and teams.",
    cta: "Explore Corporate",
    place: { name: "Rambagh Palace", city: "Jaipur" },
    fallback:
      "https://images.unsplash.com/photo-1590050720562-b9cf67ecbebd?auto=format&fit=crop&w=2000&q=80",
  },
];

const PrivateJourneysCorporateTravel = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      // Respect reduced motion: leave everything in its visible resting state.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const panelEls = gsap.utils.toArray<HTMLElement>(".journey-panel");

      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: "top 68%" },
      });

      panelEls.forEach((panel, i) => {
        const media = panel.querySelector(".panel-media");
        const inner = panel.querySelector(".panel-inner");
        const from = i === 0 ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)";

        tl.fromTo(
          media,
          { clipPath: from },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.out" },
          i * 0.18,
        ).fromTo(
          inner,
          { rotationY: i === 0 ? 10 : -10, y: 44, opacity: 0 },
          { rotationY: 0, y: 0, opacity: 1, duration: 1.2, ease: "power3.out" },
          0.22 + i * 0.18,
        );
      });

      // Depth: each backdrop drifts against the scroll.
      gsap.utils.toArray<HTMLElement>(".panel-parallax").forEach((layer) => {
        gsap.fromTo(
          layer,
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          },
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <FullBleed ref={sectionRef} className="relative bg-deep-charcoal-950">
      {/* Editorial index label, legible over both halves */}
      <div className="pointer-events-none absolute top-8 left-6 z-30 flex items-center space-x-3 font-mono text-xs tracking-widest uppercase text-warm-ivory mix-blend-difference md:top-12 md:left-16">
        <span>05</span>
        <span className="w-8 h-[1px] bg-current" />
        <span>Private &amp; Corporate</span>
      </div>

      <div className="flex flex-col md:flex-row md:h-screen">
        {PANELS.map((panel, i) => (
          <Link
            key={panel.id}
            href={panel.href}
            aria-label={panel.title.join(" ")}
            className="journey-panel group/panel relative flex min-h-[62vh] grow flex-col justify-end overflow-hidden border-b border-warm-ivory/10 p-8 transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none [perspective:1200px] last:border-b-0 focus-visible:ring-1 focus-visible:ring-saffron-500 focus-visible:ring-inset md:min-h-0 md:hover:grow-[1.6] md:focus-visible:grow-[1.6] md:border-r md:border-b-0 md:last:border-r-0 md:p-16"
          >
            {/* Backdrop: clip wipe (GSAP) → parallax (GSAP) → image (CSS hover scale) */}
            <div className="panel-media absolute inset-0 overflow-hidden">
              <div className="panel-parallax absolute inset-[-8%]">
                <PlaceImage
                  name={panel.place.name}
                  city={panel.place.city}
                  width={1600}
                  asBackground
                  fallbackUrl={panel.fallback}
                  className="panel-image absolute inset-0 h-full w-full transition-transform duration-[1.6s] ease-out group-hover/panel:scale-[1.12] group-focus-visible/panel:scale-[1.12]"
                />
              </div>
            </div>

            {/* Scrim — per panel only, never dims the sibling */}
            <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal-950 via-deep-charcoal-950/70 to-deep-charcoal-950/20 transition-opacity duration-700 group-hover/panel:opacity-80 group-focus-visible/panel:opacity-80" />

            <div
              className={`panel-inner relative z-10 flex h-full max-w-xl flex-col justify-end text-warm-ivory ${
                i === 0 ? "origin-left" : "origin-right"
              }`}
            >
              <h2 className="mb-6 font-serif text-4xl leading-[0.95] tracking-tight text-warm-ivory-50 md:text-5xl lg:text-7xl">
                {panel.title[0]}
                <br />
                {panel.title[1]}
              </h2>

              <p className="mb-8 max-w-sm font-sans text-lg font-light leading-relaxed text-warm-ivory/75 transition-colors duration-500 group-hover/panel:text-warm-ivory md:text-xl">
                {panel.copy}
              </p>

              {/* CTA: always legible on touch, revealed on hover/focus at md+ */}
              <div className="flex items-center gap-4 font-mono text-xs tracking-widest uppercase text-saffron-400 opacity-100 transition-all duration-500 md:translate-y-2 md:opacity-0 md:group-hover/panel:translate-y-0 md:group-hover/panel:opacity-100 md:group-focus-visible/panel:translate-y-0 md:group-focus-visible/panel:opacity-100">
                <span>{panel.cta}</span>
                <span className="h-[1px] w-8 origin-left bg-saffron-400 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:scale-x-[0.4] md:group-hover/panel:scale-x-100 md:group-focus-visible/panel:scale-x-100" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </FullBleed>
  );
};

export default PrivateJourneysCorporateTravel;

'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ArrivalHero from '@/components/features/home/01-arrival-hero';
import Chapter02Discover from '@/components/features/home/chapter-02';
import TornBannerSection from '@/components/features/home/TornBannerSection';
import PlanExperienceSection from '@/components/features/home/04-plan-experience';
import ManageChapter from '@/components/features/home/05-manage-chapter';
import RememberMemoryField from '@/components/features/home/06-remember-memory-field';
import NextJourneyFooter from '@/components/features/home/07-next-journey-footer';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  useEffect(() => {
    // Ensure all ScrollTriggers are measured in strict top-to-bottom document order
    const syncScroll = () => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };

    const t1 = setTimeout(syncScroll, 50);
    const t2 = setTimeout(syncScroll, 300);
    const t3 = setTimeout(syncScroll, 1000);

    window.addEventListener('load', syncScroll);
    window.addEventListener('resize', syncScroll);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('load', syncScroll);
      window.removeEventListener('resize', syncScroll);
    };
  }, []);

  return (
    <div className="relative w-full bg-paper-warm overflow-x-hidden selection:bg-brand-primary selection:text-white">
      {/* Chapter 01: Arrival (Geographic Window Zoom to Fullscreen) */}
      <ArrivalHero />

      {/* Chapter 02: Complete Discover Journey Connected by Continuous Chapter-Level Line */}
      <Chapter02Discover />

      {/* Dramatic Editorial Chapter Break */}
      <TornBannerSection />

      {/* Chapter 03 & 04: Plan → Experience (Signature Moment: Paper → Place) */}
      <PlanExperienceSection />

      {/* Chapter 05: Manage (Calm Control) */}
      <ManageChapter />

      {/* Chapter 06: Remember (Signature Moment: Memory Field) */}
      <RememberMemoryField />

      {/* Chapter 07: Next Journey & Resolution Footer */}
      <NextJourneyFooter />
    </div>
  );
}
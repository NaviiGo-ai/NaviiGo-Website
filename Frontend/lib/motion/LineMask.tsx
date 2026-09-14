'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface LineMaskProps {
  children: React.ReactNode;
  className?: string;
}

export default function LineMask({ children, className = '' }: LineMaskProps) {
  const container = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!container.current || !inner.current) return;
    // gsap.context is automatically established by useGSAP
    const anim = gsap.fromTo(
      inner.current,
      { y: '110%' },
      {
        y: '0%',
        duration: 1,
        ease: 'power4.out',
        // Keep content visible until ScrollTrigger actually starts.
        // This prevents "empty sections" when screenshots capture mid-hydration.
        immediateRender: false,
        scrollTrigger: {
          trigger: container.current,
          start: 'top 85%',
          // We can add more ScrollTrigger options if needed
        }
      }
    );

    return () => {
      anim.kill();
    };
  }, { scope: container });

  return (
    // The mask clips to the line box, so descenders (g, y, p) need room the
    // negative margin gives back — otherwise their tails get cut off.
    <div className={`overflow-hidden pb-[0.14em] -mb-[0.14em] ${className}`} ref={container}>
      <div className="block" ref={inner}>
        {children}
      </div>
    </div>
  );
}
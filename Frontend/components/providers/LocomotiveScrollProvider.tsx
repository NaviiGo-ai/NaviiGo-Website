'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface LocomotiveScrollContextType {
  scroll: any | null;
  isReady: boolean;
}

const LocomotiveScrollContext = createContext<LocomotiveScrollContextType>({
  scroll: null,
  isReady: false,
});

export const useLocomotiveScroll = () => useContext(LocomotiveScrollContext);

interface LocomotiveScrollProviderProps {
  children: React.ReactNode;
}

export default function LocomotiveScrollProvider({ children }: LocomotiveScrollProviderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollInstance, setScrollInstance] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (!isHomePage) return;
    let locomotiveScroll: any = null;

    const initLocomotiveScroll = async () => {
      if (typeof window === 'undefined' || !containerRef.current) return;

      try {
        const LocomotiveScroll = (await import('locomotive-scroll')).default;

        locomotiveScroll = new LocomotiveScroll({
          el: containerRef.current,
          smooth: true,
          lerp: 0.08,
          multiplier: 1,
          firefoxMultiplier: 5,
          touchMultiplier: 2,
          scrollFromAnywhere: true,
          tablet: {
            smooth: true,
            breakpoint: 768,
          },
          smartphone: {
            smooth: false,
          },
        });

        setScrollInstance(locomotiveScroll);
        setIsReady(true);

        setTimeout(() => {
          locomotiveScroll?.update();
        }, 500);
      } catch (err) {
        console.warn('LocomotiveScroll initialized with CDN fallback script:', err);
        if ((window as any).LocomotiveScroll && containerRef.current) {
          const LocomotiveScrollCDN = (window as any).LocomotiveScroll;
          locomotiveScroll = new LocomotiveScrollCDN({
            el: containerRef.current,
            smooth: true,
            lerp: 0.08,
            smartphone: { smooth: false },
          });
          setScrollInstance(locomotiveScroll);
          setIsReady(true);
        }
      }
    };

    initLocomotiveScroll();

    return () => {
      if (locomotiveScroll) {
        try {
          locomotiveScroll.destroy();
        } catch (_) {}
      }
      setScrollInstance(null);
      setIsReady(false);
    };
  }, [isHomePage]);

  // Only wrap home page with Locomotive Scroll container; all other pages use standard native scroll
  if (!isHomePage) {
    return <>{children}</>;
  }

  return (
    <LocomotiveScrollContext.Provider value={{ scroll: scrollInstance, isReady }}>
      <div data-scroll-container ref={containerRef} className="relative w-full">
        {children}
      </div>
    </LocomotiveScrollContext.Provider>
  );
}

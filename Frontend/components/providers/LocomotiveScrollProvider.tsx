'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocomotiveScrollContextType {
  scroll: any | null;
  isReady: boolean;
}

const LocomotiveScrollContext = createContext<LocomotiveScrollContextType>({
  scroll: null,
  isReady: true,
});

export const useLocomotiveScroll = () => useContext(LocomotiveScrollContext);

interface LocomotiveScrollProviderProps {
  children: React.ReactNode;
}

export default function LocomotiveScrollProvider({ children }: LocomotiveScrollProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // GSAP ScrollTrigger is the primary, hardware-accelerated scroll animation
    // engine powering Naviigo. This provider maintains context compatibility cleanly.
    setIsReady(true);
  }, []);

  return (
    <LocomotiveScrollContext.Provider value={{ scroll: null, isReady }}>
      {children}
    </LocomotiveScrollContext.Provider>
  );
}


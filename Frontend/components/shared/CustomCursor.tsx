'use client';

import { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    // Only enable on desktop with fine pointer & no reduced motion
    const hasFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasFinePointer || prefersReducedMotion) {
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) setVisible(true);

      // Check if target or parent has data-cursor attribute
      const target = e.target as HTMLElement | null;
      const cursorTarget = target?.closest('[data-cursor]') as HTMLElement | null;
      if (cursorTarget) {
        setLabel(cursorTarget.getAttribute('data-cursor') || '');
        setActive(true);
      } else {
        setLabel('');
        setActive(false);
      }
    };

    const onMouseLeave = () => {
      setVisible(false);
    };

    const render = () => {
      currentX += (mouseX - currentX) * 0.2;
      currentY += (mouseY - currentY) * 0.2;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
      animId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className={`fixed top-0 left-0 pointer-events-none z-[9999] rounded-full flex items-center justify-center transition-[width,height,background-color,border-color] duration-200 ease-out will-change-transform ${
        active && label
          ? 'w-16 h-16 bg-naviigo-orange text-white text-[10px] font-mono tracking-widest uppercase font-semibold shadow-lg'
          : 'w-3 h-3 bg-naviigo-orange/80 ring-2 ring-naviigo-orange/30'
      }`}
    >
      {label && <span className="select-none pointer-events-none">{label}</span>}
    </div>
  );
}

'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type RevealType = 'vertical' | 'horizontal' | 'curtain' | 'clip-path';

interface ImageRevealProps {
  src: string;
  alt: string;
  type?: RevealType;
  className?: string;
}

export default function ImageReveal({ src, alt, type = 'vertical', className = '' }: ImageRevealProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useGSAP(() => {
    if (!wrapperRef.current || !maskRef.current || !imageRef.current) return;

    const wrapper = wrapperRef.current;
    const mask = maskRef.current;
    const image = imageRef.current;

    gsap.set(image, { scale: 1.15 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: 'top bottom-=100',
        toggleActions: 'play none none reverse',
      }
    });

    switch (type) {
      case 'vertical':
        gsap.set(mask, { height: '0%' });
        tl.to(mask, { height: '100%', duration: 1.2, ease: 'expo.out' })
          .to(image, { scale: 1, duration: 1, ease: 'power4.out' }, '<');
        break;
      case 'horizontal':
        gsap.set(mask, { width: '0%' });
        tl.to(mask, { width: '100%', duration: 1.2, ease: 'expo.out' })
          .to(image, { scale: 1, duration: 1, ease: 'power4.out' }, '<');
        break;
      case 'curtain':
        gsap.set(mask, { clipPath: 'inset(0 100% 0 0)' });
        tl.to(mask, { clipPath: 'inset(0 0 0 0)', duration: 1.2, ease: 'expo.out' })
          .to(image, { scale: 1, duration: 1, ease: 'power4.out' }, '<');
        break;
      case 'clip-path':
        gsap.set(image, { clipPath: 'circle(0% at 50% 50%)' });
        tl.to(image, { clipPath: 'circle(100% at 50% 50%)', duration: 1.2, ease: 'expo.out' })
          .to(image, { scale: 1, duration: 0.8, ease: 'power4.out' }, '<');
        break;
      default:
        break;
    }

    // Return cleanup function for useGSAP
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="overflow-hidden" ref={maskRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="block w-full h-auto" ref={imageRef} />
      </div>
    </div>
  );
}
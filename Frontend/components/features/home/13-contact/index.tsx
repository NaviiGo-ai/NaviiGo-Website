'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import FullBleed from '@/components/layout/primitives/FullBleed';
import LineMask from '@/lib/motion/LineMask';
import PlaceImage from '@/components/shared/PlaceImage';

gsap.registerPlugin(ScrollTrigger);

const CONTACT_EMAIL = 'contact@naviigo.com';
const PHONE_DISPLAY = '+1 (800) 555-0199';
const PHONE_HREF = 'tel:+18005550199';

const FIELDS = [
  { id: 'name', label: 'Your Name', type: 'text', autoComplete: 'name' },
  { id: 'email', label: 'Email Address', type: 'email', autoComplete: 'email' },
  { id: 'phone', label: 'Phone Number', type: 'tel', autoComplete: 'tel' },
] as const;

type FieldId = (typeof FIELDS)[number]['id'] | 'message';
type FormState = Record<FieldId, string>;

const EMPTY_FORM: FormState = { name: '', email: '', phone: '', message: '' };

export default function Contact() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorialRef = useRef<HTMLDivElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [sent, setSent] = useState(false);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // 1. Editorial wipe — the left column unfolds downward from its top edge.
      gsap.fromTo(
        editorialRef.current,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.5,
          ease: 'expo.out',
          scrollTrigger: { trigger: containerRef.current, start: 'top 78%' },
        }
      );

      // 2. The form arrives as a plane swinging in from the reader's side.
      gsap.fromTo(
        formPanelRef.current,
        { rotateX: 9, rotateY: -12, y: 70, z: -160, opacity: 0 },
        {
          rotateX: 0,
          rotateY: 0,
          y: 0,
          z: 0,
          opacity: 1,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: formPanelRef.current, start: 'top 88%' },
        }
      );

      // 3. Each field rule draws itself in, one after the next.
      gsap.fromTo(
        '.contact-rule',
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: 1.1,
          stagger: 0.14,
          ease: 'power3.out',
          scrollTrigger: { trigger: formPanelRef.current, start: 'top 85%' },
        }
      );

      // 4. The lake drifts against the scroll.
      gsap.fromTo(
        backdropRef.current,
        { yPercent: -7 },
        {
          yPercent: 7,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        }
      );
    });

    return () => mm.revert();
  }, { scope: containerRef });

  const handleField =
    (id: FieldId) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [id]: event.target.value }));

  const handleMessage = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = event.target;
    setForm((prev) => ({ ...prev, message: el.value }));
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = `Private inquiry${form.name ? ` — ${form.name}` : ''}`;
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      '',
      form.message,
    ].join('\n');

    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const inputClass =
    'w-full bg-transparent border-b border-warm-ivory/15 pb-4 lg:pb-6 text-3xl lg:text-4xl xl:text-5xl font-serif text-warm-ivory focus:outline-none focus:border-warm-ivory/40 transition-colors duration-500 rounded-none shadow-none';
  const labelClass =
    'absolute left-0 top-0 font-mono text-[11px] tracking-[0.25em] uppercase text-warm-ivory/40 transition-all duration-500 group-focus-within:text-warm-ivory/80 group-focus-within:-translate-y-1 pointer-events-none';
  const railLinkClass =
    'block text-warm-ivory/45 hover:text-saffron-400 transition-colors duration-500';

  return (
    <FullBleed className="relative bg-deep-charcoal-950 text-warm-ivory">
      {/* Atmosphere: a real Rajasthan lake held far back behind the type. */}
      <div
        ref={backdropRef}
        className="pointer-events-none absolute inset-x-0 -top-[8%] h-[116%]"
      >
        <PlaceImage
          name="Lake Pichola"
          city="Udaipur"
          width={2000}
          asBackground
          className="absolute inset-0 opacity-[0.16]"
          fallbackUrl="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-charcoal-950 via-deep-charcoal-950/40 to-deep-charcoal-950" />
      </div>

      <section
        id="contact"
        ref={containerRef}
        className="relative z-10 w-full max-w-[1500px] mx-auto px-6 md:px-12 py-32 lg:py-48 grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-10"
      >
        {/* Left: the invitation */}
        <div ref={editorialRef} className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 font-mono text-[11px] tracking-[0.3em] uppercase text-warm-ivory/50 mb-14">
              <span>13</span>
              <span className="w-10 h-px bg-warm-ivory/30" />
              <span>Contact</span>
            </div>

            <h2 className="text-[3.25rem] md:text-[4.25rem] lg:text-[4.75rem] xl:text-[5.25rem] font-serif leading-[0.92] tracking-tight mb-12">
              <LineMask>Begin a</LineMask>
              <LineMask>
                conversation<span className="text-saffron-500">.</span>
              </LineMask>
            </h2>

            <LineMask>
              <p className="text-lg md:text-xl font-sans text-warm-ivory/60 max-w-md leading-relaxed">
                Tell us who you are travelling with, and what you want the days to feel like.
                A private concierge reads every note and answers personally.
              </p>
            </LineMask>
          </div>

          <div className="mt-24 hidden lg:block">
            <div className="space-y-5 font-mono text-[11px] tracking-[0.25em] uppercase">
              <LineMask>
                <a href={`mailto:${CONTACT_EMAIL}`} className={railLinkClass}>
                  {CONTACT_EMAIL}
                </a>
              </LineMask>
              <LineMask>
                <a href={PHONE_HREF} className={railLinkClass}>
                  {PHONE_DISPLAY}
                </a>
              </LineMask>
              <LineMask>
                <Link href="/support" className={railLinkClass}>
                  Support &amp; FAQs
                </Link>
              </LineMask>
            </div>
            <p className="mt-12 pt-8 border-t border-warm-ivory/10 w-56 text-[11px] font-mono tracking-[0.25em] uppercase text-warm-ivory/30">
              Concierge desk, Udaipur
            </p>
          </div>
        </div>

        {/* Right: the note */}
        <div className="lg:col-span-6 lg:col-start-7 flex flex-col justify-center">
          <div style={{ perspective: '1400px' }}>
            <div
              ref={formPanelRef}
              className="origin-left will-change-transform border-t border-warm-ivory/15 pt-14 lg:pt-20"
            >
              <form onSubmit={handleSubmit} className="space-y-12 lg:space-y-14">
                {FIELDS.map((field) => (
                  <div key={field.id} className="group relative pt-6">
                    <label htmlFor={field.id} className={labelClass}>
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      required
                      value={form[field.id]}
                      onChange={handleField(field.id)}
                      className={inputClass}
                    />
                    <span className="contact-rule absolute left-0 bottom-0 h-px w-full bg-warm-ivory/15" />
                    <span className="absolute left-0 bottom-0 h-px w-0 bg-warm-ivory transition-all duration-700 ease-out group-focus-within:w-full" />
                  </div>
                ))}

                <div className="group relative pt-6">
                  <label htmlFor="message" className={labelClass}>
                    Where do you wish to explore?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={1}
                    required
                    value={form.message}
                    onChange={handleMessage}
                    className={`${inputClass} resize-none overflow-hidden leading-tight`}
                  />
                  <span className="contact-rule absolute left-0 bottom-0 h-px w-full bg-warm-ivory/15" />
                  <span className="absolute left-0 bottom-0 h-px w-0 bg-warm-ivory transition-all duration-700 ease-out group-focus-within:w-full" />
                </div>

                <div className="flex items-end justify-between gap-8 pt-6">
                  <p
                    aria-live="polite"
                    className="font-mono text-[11px] tracking-[0.22em] uppercase text-warm-ivory/40 max-w-[19rem] leading-relaxed"
                  >
                    {sent
                      ? 'Your note is opening in your own mail client.'
                      : 'Your note opens in your own mail client. Nothing is stored here.'}
                  </p>
                  <button
                    type="submit"
                    className="group flex shrink-0 items-center gap-5 cursor-pointer"
                  >
                    <span className="font-mono text-sm tracking-[0.2em] uppercase text-warm-ivory/60 group-hover:text-warm-ivory transition-colors duration-500">
                      Send Inquiry
                    </span>
                    <span className="w-20 h-20 lg:w-24 lg:h-24 rounded-full border border-warm-ivory/20 flex items-center justify-center group-hover:bg-warm-ivory group-hover:text-deep-charcoal transition-all duration-700 ease-out group-hover:border-warm-ivory">
                      <svg
                        className="w-6 h-6 lg:w-8 lg:h-8 -rotate-45 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Mobile rail */}
          <div className="mt-20 lg:hidden border-t border-warm-ivory/10 pt-10 space-y-4 text-center font-mono text-[11px] tracking-[0.25em] uppercase">
            <a href={`mailto:${CONTACT_EMAIL}`} className={railLinkClass}>
              {CONTACT_EMAIL}
            </a>
            <a href={PHONE_HREF} className={railLinkClass}>
              {PHONE_DISPLAY}
            </a>
            <Link href="/support" className={railLinkClass}>
              Support &amp; FAQs
            </Link>
            <p className="pt-6 text-warm-ivory/30">Concierge desk, Udaipur</p>
          </div>
        </div>
      </section>
    </FullBleed>
  );
}

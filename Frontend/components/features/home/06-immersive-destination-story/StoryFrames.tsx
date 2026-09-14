'use client';

import type { RefObject } from 'react';
import Link from 'next/link';
import PlaceImage from '@/components/shared/PlaceImage';

export type DivRef = RefObject<HTMLDivElement | null>;
export type SpanRef = RefObject<HTMLSpanElement | null>;

// The section's original photography is kept as the honest fallback for the
// live Google Places pipeline — never as the only source.
const GROUND_FALLBACK =
  'https://images.unsplash.com/photo-1599827552599-eadf5af3c6ce?q=80&w=2940&auto=format&fit=crop';
const DETAIL_FALLBACK =
  'https://images.unsplash.com/photo-1601058269784-0a3eb7ca0f86?q=80&w=2070&auto=format&fit=crop';

const ATTRIBUTES = ['Private Palace Access', 'Exclusive Royal Dining', 'Curated After Hours'];

/** Cinematic ground: a real Places photo of Amber Fort under directional scrims. */
export function StoryGround({ imageRef, veilRef }: { imageRef?: DivRef; veilRef?: DivRef }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={imageRef} className="absolute inset-0 origin-center will-change-transform">
        <PlaceImage
          name="Amber Fort"
          city="Jaipur"
          width={2000}
          asBackground
          fallbackUrl={GROUND_FALLBACK}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {/* Directional scrims carry the contrast — no drop shadows anywhere in this section. */}
      <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal-950 via-deep-charcoal-950/30 to-deep-charcoal-950/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-deep-charcoal-950/90 via-deep-charcoal-950/25 to-transparent" />
      <div ref={veilRef} className="absolute inset-0 bg-deep-charcoal-950 opacity-0" />
    </div>
  );
}

/** Frame one — the title card. Lines are driven in 3D by the section timeline. */
export function StoryTitleFrame({
  line1Ref,
  line2Ref,
  metaRef,
}: {
  line1Ref: SpanRef;
  line2Ref: SpanRef;
  metaRef: DivRef;
}) {
  return (
    <div className="relative z-10 w-full px-6 text-center">
      <div className="[perspective:1400px]">
        <h2 className="font-serif text-5xl leading-[0.92] tracking-tight text-warm-ivory-50 sm:text-7xl md:text-8xl lg:text-[8.5rem]">
          <span ref={line1Ref} className="block will-change-transform [transform-style:preserve-3d]">
            The Echoes
          </span>
          <span
            ref={line2Ref}
            className="block italic text-saffron-300 will-change-transform [transform-style:preserve-3d]"
          >
            of Empire
          </span>
        </h2>
      </div>

      <div
        ref={metaRef}
        className="mt-10 flex flex-col items-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-warm-ivory-50/70 md:mt-16 md:text-xs"
      >
        <span className="text-saffron-400">Jaipur, Rajasthan</span>
        <span className="h-px w-10 bg-warm-ivory-50/30" aria-hidden="true" />
        <span>Founded 1727</span>
      </div>
    </div>
  );
}

/** Frame two — the editorial spread. Detail unfolds; copy arrives in perspective. */
export function StoryEditorialFrame({
  copyRef,
  cardRef,
  innerRef,
}: {
  copyRef: DivRef;
  cardRef: DivRef;
  innerRef: DivRef;
}) {
  return (
    <div className="relative z-20 w-full">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-12 md:gap-16 md:px-16">
        <div ref={copyRef} className="order-2 will-change-transform [perspective:1000px] md:order-1 md:col-span-6">
          <h3 className="font-serif text-4xl leading-[1.05] tracking-tight text-warm-ivory-50 md:text-6xl">
            A profound <span className="italic text-saffron-300">heritage.</span>
          </h3>
          <p className="mt-6 max-w-lg font-sans text-base font-light leading-relaxed text-warm-ivory-50/80 md:mt-8 md:text-lg">
            Where centuries of royal lineage and monumental reverence weave into the very architecture of the
            landscape. Some places do not merely change your itinerary — they rewrite your understanding of majesty.
          </p>

          {/* Stacked, hairline-separated attributes — no middle-dot joins. */}
          <ul className="mt-10 w-full max-w-xs border-t border-warm-ivory-50/15">
            {ATTRIBUTES.map((attribute) => (
              <li
                key={attribute}
                className="border-b border-warm-ivory-50/15 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-warm-ivory-50/65 md:text-[11px]"
              >
                {attribute}
              </li>
            ))}
          </ul>

          <Link
            href="/explore"
            className="group mt-10 inline-block font-mono text-[10px] uppercase tracking-[0.3em] text-warm-ivory-50 md:text-xs"
          >
            <span className="relative inline-block">
              Explore Rajasthan
              <span className="absolute -bottom-1.5 left-0 h-px w-full bg-warm-ivory-50/25" aria-hidden="true" />
              <span
                className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-saffron-400 transition-transform duration-500 ease-out group-hover:scale-x-100"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>

        <div className="order-1 md:order-2 md:col-span-5 md:col-start-8">
          <div
            ref={cardRef}
            className="relative ml-auto aspect-[4/5] w-full max-w-sm overflow-hidden will-change-transform"
          >
            <div ref={innerRef} className="absolute inset-0 will-change-transform">
              <PlaceImage
                name="Hawa Mahal"
                city="Jaipur"
                width={1200}
                fallbackUrl={DETAIL_FALLBACK}
                className="absolute inset-0 h-full w-full"
              />
            </div>
            {/* Double hairline frame in place of any shadow. */}
            <div className="pointer-events-none absolute inset-0 border border-warm-ivory-50/20" />
            <div className="pointer-events-none absolute inset-3 border border-warm-ivory-50/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

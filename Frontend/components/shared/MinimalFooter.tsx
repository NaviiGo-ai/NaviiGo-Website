'use client';

import Link from 'next/link';

export default function MinimalFooter() {
  return (
    <footer className="relative bg-deep-charcoal text-warm-ivory pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid gap-12 md:grid-cols-[1fr_1fr_1fr] lg:grid-cols-[1fr_1fr_1fr_1fr]">
          {/* Logo and brand info */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif leading-snug tracking-tighter">
              NaviiGo
            </h2>
            <p className="text-lg md:text-xl text-warm-ivory/80 leading-relaxed">
              Curating extraordinary journeys for the discerning traveler.
            </p>
            <div className="flex space-x-4 mt-4">
              <a
                href="#"
                className="p-2 bg-warm-ivory/20 hover:bg-warm-ivory/30 rounded-full transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 text-warm-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                </svg>
              </a>
              <a
                href="#"
                className="p-2 bg-warm-ivory/20 hover:bg-warm-ivory/30 rounded-full transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 text-warm-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37a4 4 0 11-5.657 5.657M12 13a3 3 0 100-6 3 3 0 000 6z"/>
                </svg>
              </a>
              <a
                href="#"
                className="p-2 bg-warm-ivory/20 hover:bg-warm-ivory/30 rounded-full transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5 text-warm-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-warm-ivory mb-2">
              Explore & Plan
            </h3>
            <nav className="space-y-2 font-mono text-xs uppercase tracking-wider">
              <Link href="/explore" className="block hover:text-warm-ivory/80 transition-colors">
                Digital Atlas
              </Link>
              <Link href="/plan" className="block hover:text-warm-ivory/80 transition-colors">
                Plan A Journey
              </Link>
              <Link href="/passport" className="block hover:text-warm-ivory/80 transition-colors">
                Travel Archive
              </Link>
              <Link href="/bookings" className="block hover:text-warm-ivory/80 transition-colors">
                Document Wallet
              </Link>
              <Link href="/about" className="block hover:text-warm-ivory/80 transition-colors">
                Philosophy & About
              </Link>
              <Link href="/support" className="block hover:text-warm-ivory/80 transition-colors">
                Support & Guides
              </Link>
            </nav>
          </div>

          {/* Social media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-warm-ivory mb-2">
              Follow Us
            </h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="p-2 bg-warm-ivory/20 hover:bg-warm-ivory/30 rounded-full transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 text-warm-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                </svg>
              </a>
              <a
                href="#"
                className="p-2 bg-warm-ivory/20 hover:bg-warm-ivory/30 rounded-full transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 text-warm-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37a4 4 0 11-5.657 5.657M12 13a3 3 0 100-6 3 3 0 000 6z"/>
                </svg>
              </a>
              <a
                href="#"
                className="p-2 bg-warm-ivory/20 hover:bg-warm-ivory/30 rounded-full transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5 text-warm-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </a>
              <a
                href="#"
                className="p-2 bg-warm-ivory/20 hover:bg-warm-ivory/30 rounded-full transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5 text-warm-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M20 4H7c-1 0-2 1-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6c0-1-1-2-2-2zm0 12H7V10h5v2a2 2 0 002 2zm-4-6a2 2 0 110-4 2 2 0 010 4zm5-8a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-warm-ivory mb-2">
              Stay Inspired
            </h3>
            <p className="text-warm-ivory/60 mb-4">
              Subscribe to our newsletter for the latest travel insights and exclusive offers.
            </p>
            <form className="flex space-x-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-warm-ivory/20 rounded-md focus:outline-none focus:ring-2 focus:ring-warm-ivory/50 bg-deep-charcoal/50 text-warm-ivory"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-warm-ivory hover:bg-warm-ivory/90 text-deep-charcoal font-sans text-lg rounded-full transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 text-center text-warm-ivory/60 border-t border-warm-ivory/10 pt-8">
          <p>
            &copy; {new Date().getFullYear()} NaviiGo. All rights reserved.
          </p>
          <p className="mt-2 text-sm">
            <Link href="/privacy" className="hover:text-warm-ivory/80 transition-colors">
              Privacy Policy
            </Link>
            <span className="mx-2">|</span>
            <Link href="/terms" className="hover:text-warm-ivory/80 transition-colors">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
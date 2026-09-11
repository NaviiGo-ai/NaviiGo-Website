'use client';

import Link from 'next/link';

const footerLinks = {
  Explore: [
    { label: 'Varanasi', href: '/explore/Varanasi' },
    { label: 'Rajasthan', href: '/explore/Rajasthan' },
    { label: 'Kerala', href: '/explore/Kerala' },
    { label: 'Himalayas', href: '/explore/Himalayas' },
    { label: 'All Destinations', href: '/explore' },
  ],
  Product: [
    { label: 'AI Itinerary', href: '/itinerary' },
    { label: 'Bookings', href: '/bookings' },
    { label: 'Digital Passport', href: '/passport' },
    { label: 'Deals', href: '/deals' },
    { label: 'Saved Trips', href: '/saved' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Support', href: '/support' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-card text-card-foreground border-t border-border overflow-hidden">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-8 sm:pb-10">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-16">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              onClick={(e) => {
                if (typeof window !== 'undefined' && window.location.pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-xs font-sans">
                N
              </div>
              <span className="text-xl font-bold tracking-tight font-sans">NaviiGo</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
              India&apos;s smartest travel companion. AI-powered itineraries, real-time booking aggregation, and a gamified travel passport.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: '𝕏', href: '#', label: 'Twitter' },
                { icon: 'in', href: '#', label: 'LinkedIn' },
                { icon: '📸', href: '#', label: 'Instagram' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="h-9 w-9 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground flex items-center justify-center text-xs text-muted-foreground transition-colors border border-border/50"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-5">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="rounded-2xl bg-muted/40 border border-border p-5 sm:p-8 md:p-10 mb-8 sm:mb-12 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-foreground font-serif mb-1">Stay in the loop</h3>
              <p className="text-sm text-muted-foreground">Get travel inspiration, new features & exclusive deals delivered to your inbox.</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder="you@email.com"
                aria-label="Email for travel tips newsletter"
                className="flex-1 md:w-64 px-4 py-2.5 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
              <button className="px-6 py-2.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 shadow-xs">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NaviiGo. All rights reserved. Built with ❤️ in India.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-muted-foreground/80">Aggregation only · Affiliate redirections · No direct payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

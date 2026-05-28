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
    { label: 'Privacy Policy', href: '/support' },
    { label: 'Terms of Service', href: '/support' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-slate-950 text-white overflow-hidden">
      {/* Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-sm font-bold">
                N
              </div>
              <span className="text-xl font-bold tracking-tight">NaviiGo</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
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
                  className="h-9 w-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-300 transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-5">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
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
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/50 p-8 md:p-10 mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Stay in the loop</h3>
              <p className="text-sm text-slate-400">Get travel inspiration, new features & exclusive deals delivered to your inbox.</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder="you@email.com"
                className="flex-1 md:w-64 px-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/50 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
              />
              <button className="px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} NaviiGo. All rights reserved. Built with ❤️ in India.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-600">Aggregation only · Affiliate redirections · No direct payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

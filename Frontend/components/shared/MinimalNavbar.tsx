'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const NAV_LINKS = [
  { name: 'Discover', href: '/explore', chapter: '02' },
  { name: 'Plan', href: '/plan', chapter: '03' },
  { name: 'Passport', href: '/passport', chapter: '04' },
  { name: 'Bookings', href: '/bookings', chapter: '05' },
  { name: 'About', href: '/about', chapter: '06' },
];

export default function MinimalNavbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on navigation link click handled directly in handlers
  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  const isLightNav = isHome && !scrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 will-change-transform ${
          scrolled
            ? 'bg-paper-light/95 backdrop-blur-md border-b border-naviigo-brown/10 py-3.5 shadow-sm text-naviigo-text'
            : 'bg-paper-warm/80 backdrop-blur-sm py-5 text-naviigo-brown'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Logo Brand Lockup */}
          <Link
            href="/"
            className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naviigo-orange rounded-sm"
          >
            <div className="relative w-8 h-8 md:w-9 md:h-9 shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/brand/naviigo-mark-primary.png"
                alt="NaviiGo Logo Mark"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl md:text-2xl font-bold tracking-tight text-naviigo-brown transition-colors duration-300">
                Naviigo
              </span>
              <span className="hidden sm:block text-[9px] font-mono tracking-[0.2em] uppercase -mt-1 text-naviigo-text/60">
                Travel Companion
              </span>
            </div>
          </Link>

          {/* Desktop Editorial Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-sans" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || (link.href === '/plan' && pathname.startsWith('/itinerary'));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative py-1 text-xs uppercase tracking-[0.14em] font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naviigo-orange rounded-sm ${
                    active
                      ? 'text-naviigo-orange font-semibold'
                      : 'text-naviigo-text/75 hover:text-naviigo-brown'
                  }`}
                >
                  <span className="font-mono text-[9px] mr-1.5 opacity-50">{link.chapter}</span>
                  <span>{link.name}</span>
                  {/* Subtle underline line indicator */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[1.5px] origin-left transition-transform duration-300 ease-out ${
                      active
                        ? 'scale-x-100 bg-naviigo-orange'
                        : 'scale-x-0 group-hover:scale-x-100 bg-naviigo-orange opacity-40'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Auth UI + Mobile Trigger */}
          <div className="flex items-center gap-4">
            {/* Desktop auth area */}
            <div className="hidden sm:flex items-center gap-3">
              {user ? (
                <>
                  {/* Avatar + name */}
                  <div className="flex items-center gap-2.5">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName ?? 'User'}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border-2 border-naviigo-orange/40 shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-naviigo-orange/15 flex items-center justify-center">
                        <User className="w-4 h-4 text-naviigo-orange" />
                      </div>
                    )}
                    <div className="flex flex-col leading-none">
                      <span className="text-xs font-semibold text-naviigo-brown tracking-tight">
                        {user.displayName?.split(' ')[0] ?? 'Traveler'}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-naviigo-text/50">Member</span>
                    </div>
                  </div>
                  {/* Sign out */}
                  <button
                    onClick={() => signOut()}
                    title="Sign Out"
                    className="p-1.5 rounded-full text-naviigo-text/50 hover:text-naviigo-orange hover:bg-naviigo-orange/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase font-sans transition-all duration-300 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naviigo-orange bg-naviigo-orange text-white hover:bg-naviigo-orange/90 hover:shadow-md"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" opacity=".9"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".9"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" opacity=".9"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity=".9"/>
                  </svg>
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-naviigo-brown hover:bg-naviigo-brown/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naviigo-orange touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Full-Screen Branded Menu ──────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-paper-warm text-naviigo-text flex flex-col justify-between p-6 sm:p-8 md:hidden animate-fade-up overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6rem)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
          }}
        >
          {/* Subtle Journey Line background watermark */}
          <div className="absolute top-24 right-6 w-48 h-48 opacity-10 pointer-events-none">
            <Image
              src="/brand/naviigo-mark-primary.png"
              alt=""
              width={200}
              height={200}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-6">
            <div className="font-mono text-xs tracking-widest uppercase text-naviigo-text/50 pb-2 border-b border-naviigo-brown/10">
              00 / Orientation & Navigation
            </div>
            <nav className="flex flex-col space-y-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center justify-between py-3 border-b border-naviigo-brown/5 text-2xl font-display font-medium text-naviigo-brown hover:text-naviigo-orange transition-colors min-h-[48px] touch-manipulation"
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-naviigo-text/40">{link.chapter}</span>
                    <span>{link.name}</span>
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-naviigo-text/30 group-hover:text-naviigo-orange transition-colors" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom Actions — Auth */}
          <div className="pt-6 space-y-4 border-t border-naviigo-brown/10">
            {user ? (
              <>
                {/* User info row */}
                <div className="flex items-center gap-3 px-1">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName ?? 'User'}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full border-2 border-naviigo-orange/40 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-naviigo-orange/15 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-naviigo-orange" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-semibold text-naviigo-brown truncate">
                      {user.displayName ?? 'Traveler'}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-naviigo-text/50">
                      {user.email}
                    </span>
                  </div>
                </div>
                {/* Sign out */}
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut(); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full border border-naviigo-brown/20 text-naviigo-brown font-sans text-sm font-semibold tracking-wide uppercase hover:bg-naviigo-brown/5 transition-all min-h-[48px] touch-manipulation"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); signInWithGoogle(); }}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full bg-naviigo-orange text-white font-sans text-sm font-semibold tracking-wide uppercase hover:bg-naviigo-orange/90 transition-all shadow-md min-h-[48px] touch-manipulation"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" opacity=".9"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".9"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" opacity=".9"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity=".9"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
            <div className="flex items-center justify-between text-xs font-mono text-naviigo-text/60 pt-2">
              <span>Naviigo Travel Companion</span>
              <span>2026 Edition</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
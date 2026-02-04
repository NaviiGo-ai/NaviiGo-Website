"use client";

import { JSX, useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
import { Globe, Heart, Menu, Plane, Search, User, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

/**
 * Navbar Component
 * 
 * A stunning, responsive navigation bar with glassmorphism aesthetic.
 * Features:
 * - Transparent background with backdrop blur
 * - Smooth scroll animations
 * - Mobile-responsive with hamburger menu
 * - Framer Motion micro-interactions
 */

export default function Navbar() {
  const navRef = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  // Transform scroll position to opacity for background
  const backgroundOpacity = useTransform(
    scrollY,
    [0, 100],
    [0.8, 0.95]
  );

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 20);
  });

  useEffect(() => {
    if (!navRef.current) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }, navRef);

    return () => ctx.revert();
  }, []);

  const toggleMenu = () => setIsOpen((v) => !v);

  type NavIcon = (props: { className?: string }) => React.ReactNode;
  const navItems: Array<{ name: string; href: string; icon: NavIcon }> = [
    { name: 'Flights', href: '/flights', icon: Plane },
    { name: 'Explore', href: '/explore', icon: Globe },
    { name: 'Saved', href: '/saved', icon: Heart },
  ];

  return (
    <>
      {/* Main Navbar */}
      <motion.nav
        ref={navRef}
        style={{ opacity: backgroundOpacity }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/85 backdrop-blur-md shadow-lg ring-1 ring-black/5 dark:bg-slate-950/60 dark:ring-white/10'
            : 'bg-white/70 backdrop-blur-md ring-1 ring-black/5 dark:bg-slate-950/40 dark:ring-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-2 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/" className="flex items-center space-x-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/50 backdrop-blur-md ring-1 ring-black/10 dark:bg-slate-900/40 dark:ring-white/10"
                >
                  <span className="h-4 w-4 rounded-sm bg-slate-300/80 dark:bg-slate-600/70" />
                </span>
                <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Naviigo
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <motion.div
                  key={item.name}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-slate-700 hover:text-primary transition-colors relative group dark:text-slate-200 dark:hover:text-secondary"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <Link href={item.href} className="flex items-center space-x-2">
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Search Button */}
              <motion.button
                className="p-2 rounded-full hover:bg-black/5 text-slate-700 transition-colors dark:text-slate-200 dark:hover:bg-white/10"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              <ThemeToggle />

              {/* User Account */}
              <motion.button
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(0, 102, 204, 0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="w-4 h-4" />
                <span className="font-medium text-sm">Sign In</span>
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-black/5 text-slate-700 dark:text-slate-200 dark:hover:bg-white/10"
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: isOpen ? 1 : 0,
          y: isOpen ? 0 : -20,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-40 md:hidden"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-black/25 backdrop-blur-sm"
          onClick={toggleMenu}
        />

        {/* Menu Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: isOpen ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-72 bg-white/90 backdrop-blur-md shadow-2xl ring-1 ring-black/5 dark:bg-slate-950/70 dark:ring-white/10"
        >
          <div className="p-6 space-y-6">
            {/* Close Button */}
            <div className="flex justify-end">
              <motion.button
                onClick={toggleMenu}
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6 text-slate-700 dark:text-slate-200" />
              </motion.button>
            </div>

            {/* Mobile Nav Items */}
            <div className="space-y-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 text-slate-800 hover:text-primary transition-colors dark:text-slate-200 dark:hover:text-secondary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ 
                    opacity: isOpen ? 1 : 0,
                    x: isOpen ? 0 : 20
                  }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="flex w-full items-center space-x-3"
                    onClick={toggleMenu}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Theme</div>
              <ThemeToggle />
            </div>

            {/* Mobile Actions */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <motion.button
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <User className="w-4 h-4" />
                <span className="font-medium">Sign In</span>
              </motion.button>
              
              <motion.button
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 border-black/10 text-slate-800 hover:border-primary hover:text-primary transition-colors dark:border-white/15 dark:text-slate-200 dark:hover:border-secondary dark:hover:text-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="font-medium">Create Account</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

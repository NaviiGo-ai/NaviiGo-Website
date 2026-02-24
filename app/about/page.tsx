'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function About() {
  const features = [
    {
      title: 'Intelligent Navigation',
      items: ['Learns your patterns', 'Predicts your needs', 'Saves your time'],
      icon: '🧭',
    },
    {
      title: 'Real-Time Insights',
      items: ['Live price updates', 'Instant availability', 'Smart recommendations'],
      icon: '⚡',
    },
    {
      title: 'Seamless Integration',
      items: ['One platform, endless possibilities', 'Connect everything', 'Travel smarter'],
      icon: '🔗',
    },
    {
      title: 'Effortless Experience',
      items: ['No complexity', 'Intuitive design', 'Pure joy'],
      icon: '✨',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <section className="relative min-h-[600px] overflow-hidden pt-32 pb-20">
        {/* Blur Overlay for Navbar Overlap */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/80 dark:from-neutral-950/80 via-white/40 dark:via-neutral-950/40 to-transparent backdrop-blur-sm z-10 pointer-events-none" />
        
        {/* Background Gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0066cc]/5 via-transparent to-[#0066cc]/10 dark:from-[#0066cc]/10 dark:to-[#0066cc]/5" />
          <svg
            className="absolute right-0 top-0 opacity-20 dark:opacity-10"
            viewBox="0 0 400 400"
            width="400"
            height="400"
          >
            <defs>
              <radialGradient id="grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0066cc" />
                <stop offset="100%" stopColor="#0066cc" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="200" cy="200" r="150" fill="url(#grad)" />
          </svg>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="mb-6 inline-block rounded-full bg-[#0066cc]/10 px-4 py-2 dark:bg-[#0066cc]/20">
              <span className="text-sm font-semibold text-[#0066cc]">About Us</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-6xl lg:text-7xl">
              Discover the Intelligence Behind NaviiGo
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl">
              Your ultimate platform for smarter navigation, intelligent discovery, and seamless travel experiences
            </p>
          </motion.div>

          {/* Coming Soon Section */}
          <motion.div
            className="rounded-2xl border-2 border-dashed border-[#0066cc]/30 bg-gradient-to-br from-[#0066cc]/5 to-[#0066cc]/10 p-12 dark:border-[#0066cc]/50 dark:from-[#0066cc]/15 dark:to-[#0066cc]/10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="mb-4 inline-block text-5xl"
              >
                🚀
              </motion.div>
              <h3 className="mb-2 text-2xl font-bold text-neutral-950 dark:text-white">
                NaviiGo Coming Soon
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                We&apos;re building something extraordinary. NaviiGo is under active development and we can&apos;t wait to launch it to you!
              </p>
              <motion.div
                className="mt-4 inline-block"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-sm font-semibold text-[#0066cc]">Beta Access Available Q1 2026 →</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Content Section */}
      <section className="bg-neutral-50 py-20 dark:bg-neutral-900/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="mb-8 text-4xl font-bold text-neutral-950 dark:text-white">
              What is NaviiGo?
            </h2>
            <motion.div
              className="grid gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: '⚡',
                  text: 'Smart navigation that learns what you want',
                },
                {
                  icon: '🎯',
                  text: 'Real-time intelligence for every journey',
                },
                {
                  icon: '🔗',
                  text: 'Seamlessly connect, explore, and discover',
                },
                {
                  icon: '✨',
                  text: 'Effortless movement, zero complexity',
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ x: 10 }}
                  className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 hover:border-[#0066cc]/30 transition-colors"
                >
                  <motion.span
                    className="text-3xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                  >
                    {item.icon}
                  </motion.span>
                  <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300 pt-1">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="mb-4 text-4xl font-bold text-neutral-950 dark:text-white">
              What Makes NaviiGo Different
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              We&apos;re committed to making navigation smarter, faster, and more connected
            </p>
          </motion.div>

          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="group rounded-2xl border border-neutral-200 bg-white p-8 hover:border-[#0066cc]/30 hover:shadow-lg transition-all dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-[#0066cc]/50 dark:hover:bg-neutral-900/80"
              >
                <motion.span
                  className="mb-4 inline-block text-4xl group-hover:scale-125 transition-transform"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                >
                  {feature.icon}
                </motion.span>
                <h3 className="mb-4 text-xl font-bold text-neutral-950 dark:text-white">
                  {feature.title}
                </h3>
                <motion.ul
                  className="space-y-2"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {feature.items.map((item, itemIndex) => (
                    <motion.li
                      key={itemIndex}
                      variants={itemVariants}
                      className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"
                    >
                      <motion.span
                        className="inline-block text-[#0066cc] font-bold"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: itemIndex * 0.1 }}
                      >
                        ✓
                      </motion.span>
                      {item}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Interactive Features Demo Section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="mb-4 text-4xl font-bold text-neutral-950 dark:text-white">
              How NaviiGo Works
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Experience the power of intelligent navigation through our interactive demo
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Search & Discover',
                bullets: ['Enter destination', 'Get smart suggestions', 'Find perfect match'],
                icon: '🔍',
              },
              {
                step: '02',
                title: 'Real-Time Updates',
                bullets: ['Live price tracking', 'Instant recommendations', 'Best deals first'],
                icon: '📊',
              },
              {
                step: '03',
                title: 'Book & Fly',
                bullets: ['Secure checkout', 'Instant confirmation', 'Happy travels!'],
                icon: '✈️',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative rounded-2xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900 hover:border-[#0066cc]/30 transition-colors"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0066cc]/10 text-2xl font-bold text-[#0066cc]">
                  {item.step}
                </div>
                <motion.div
                  className="mb-4 text-4xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                >
                  {item.icon}
                </motion.div>
                <h3 className="mb-4 text-xl font-bold text-neutral-950 dark:text-white">
                  {item.title}
                </h3>
                <motion.ul
                  className="space-y-2"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {item.bullets.map((bullet, bulletIndex) => (
                    <motion.li
                      key={bulletIndex}
                      variants={itemVariants}
                      className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"
                    >
                      <motion.span
                        className="inline-block text-[#0066cc]"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: bulletIndex * 0.1 }}
                      >
                        ▸
                      </motion.span>
                      {bullet}
                    </motion.li>
                  ))}
                </motion.ul>
                {index < 2 && (
                  <motion.div
                    className="absolute top-1/2 -right-4 hidden md:block text-2xl font-bold text-[#0066cc]/30"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-[#0066cc]/10 via-transparent to-[#0066cc]/10 dark:from-[#0066cc]/20 dark:to-[#0066cc]/20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-neutral-950 dark:text-white">
              Stay Updated on NaviiGo
            </h2>
            <p className="mb-8 text-neutral-600 dark:text-neutral-400">
              Get early access to beta features, exclusive updates, and be the first to know when NaviiGo launches.
            </p>
            
            <motion.form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Thanks for signing up! Check your email for early access details.');
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-950 placeholder-neutral-500 focus:border-[#0066cc] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-400"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-[#0066cc] px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 hover:bg-[#0052a3] transition-all whitespace-nowrap"
              >
                Notify Me
              </motion.button>
            </motion.form>
            
            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              Join 10,000+ people waiting for NaviiGo
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0066cc]/10 via-transparent to-[#0066cc]/10 dark:from-[#0066cc]/20 dark:to-[#0066cc]/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-6 text-4xl font-bold text-neutral-950 dark:text-white">
              Ready to Explore Smarter?
            </h2>
            <p className="mb-8 text-xl text-neutral-600 dark:text-neutral-400">
              Join thousands of users who have transformed how they navigate and discover
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/explore"
                className="inline-block rounded-lg bg-[#0066cc] px-8 py-4 font-semibold text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 hover:bg-[#0052a3] transition-all"
              >
                Start Exploring
              </Link>
              <Link
                href="/support"
                className="inline-block rounded-lg border-2 border-[#0066cc] px-8 py-4 font-semibold text-[#0066cc] hover:bg-[#0066cc]/10 transition-all dark:border-[#0066cc]/60 dark:text-[#0066cc]"
              >
                Get Support
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

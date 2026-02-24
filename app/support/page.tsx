'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, Mail, MessageCircle, Phone, Package, CreditCard, User, ShoppingCart, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', message: '', category: 'general' });

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

  const categories = [
    {
      icon: Package,
      title: 'Bookings',
      items: [
        {
          question: 'How to book a flight',
          answer: 'Visit our homepage, enter your destination and travel dates, browse available flights, compare prices and amenities, and proceed to checkout. You\'ll receive a confirmation email with your booking details and itinerary.'
        },
        {
          question: 'Modify your booking',
          answer: 'Log into your account, go to "My Bookings", select your reservation, and click "Modify". You can change dates, passengers, or flight preferences based on availability.'
        },
        {
          question: 'View your itinerary',
          answer: 'Access your itinerary anytime from your account dashboard under "My Bookings". You\'ll see flight details, times, seat assignments, and can download your ticket as PDF.'
        },
      ],
    },
    {
      icon: CreditCard,
      title: 'Payments',
      items: [
        {
          question: 'Payment methods accepted',
          answer: 'We accept all major credit cards (Visa, Mastercard, Amex), debit cards, Apple Pay, Google Pay, and bank transfers. All payments are secured with encryption.'
        },
        {
          question: 'Refund policy',
          answer: 'Most bookings can be cancelled for a full refund up to 24 hours before departure. Non-refundable fares may have different terms. Check your booking confirmation for specific policy details.'
        },
        {
          question: 'Invoice & receipts',
          answer: 'Invoices and receipts are sent to your email upon booking and can be downloaded from your account anytime. We also provide monthly billing statements for corporate accounts.'
        },
      ],
    },
    {
      icon: User,
      title: 'Account',
      items: [
        {
          question: 'Create an account',
          answer: 'Click "Sign Up" on our homepage, enter your email and password, verify your email address, and complete your profile. It takes less than 2 minutes!'
        },
        {
          question: 'Reset password',
          answer: 'Click "Forgot Password" on the login page, enter your email, and follow the link sent to reset your password. The link expires after 24 hours for security.'
        },
        {
          question: 'Manage profile',
          answer: 'Update your personal information, contact details, payment methods, and preferences from your account settings. Changes take effect immediately.'
        },
      ],
    },
    {
      icon: ShoppingCart,
      title: 'Cancellations',
      items: [
        {
          question: 'Cancel a booking',
          answer: 'Go to "My Bookings", select your reservation, and click "Cancel". You\'ll see the refund amount immediately. Process completes within 5-7 business days.'
        },
        {
          question: 'Cancellation fees',
          answer: 'Cancellation fees vary by fare type. Refundable fares have no fees, while non-refundable fares may incur charges. Your booking details show the exact policy.'
        },
        {
          question: 'Rebook options',
          answer: 'If you cancel, you can rebook with credit or request a refund. Use your credit toward any flight within 12 months of your original booking.'
        },
      ],
    },
  ];

  const faqs = [
    {
      question: 'How do I book a flight on NaviiGo?',
      answer: 'Simply enter your destination and travel dates, compare prices, select your preferred flight, and complete the checkout process. Your confirmation will be sent to your email.',
    },
    {
      question: 'What is your cancellation policy?',
      answer: 'Most bookings can be cancelled up to 24 hours before departure for a full refund. Some non-refundable fares may have different terms. Check your booking details for specific policy.',
    },
    {
      question: 'How can I modify my booking?',
      answer: 'Log into your account, go to "My Bookings", select your reservation, and click "Modify". You can change dates and passengers based on availability.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, digital wallets (Apple Pay, Google Pay), and bank transfers.',
    },
    {
      question: 'How do I track my support ticket?',
      answer: 'Once you submit a support request, you\'ll receive a ticket number via email. Use it to track your issue status anytime in our support portal.',
    },
  ];

  const channels = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Response within 24 hours',
      contact: 'naviigo24@gmail.com',
      subtext: 'For detailed inquiries',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Available 9 AM - 9 PM (UTC)',
      contact: 'Chat with us now',
      subtext: 'Quick questions answered',
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call us anytime',
      contact: '+91 7985548606',
      subtext: 'For urgent issues',
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <section className="relative min-h-[500px] overflow-hidden pt-32 pb-20">
        {/* Blur Overlay for Navbar Overlap */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/80 dark:from-neutral-950/80 via-white/40 dark:via-neutral-950/40 to-transparent backdrop-blur-sm z-10 pointer-events-none" />
        
        {/* Animated Background Network */}
        <div className="absolute inset-0 -z-10">
          <svg
            className="absolute inset-0 w-full h-full opacity-20 dark:opacity-10"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Network Nodes - Animated Circles with connecting lines */}
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connecting Lines */}
            <line x1="10%" y1="20%" x2="40%" y2="70%" stroke="#0066cc" strokeWidth="1" opacity="0.3" />
            <line x1="40%" y1="70%" x2="70%" y2="30%" stroke="#0066cc" strokeWidth="1" opacity="0.3" />
            <line x1="70%" y1="30%" x2="90%" y2="80%" stroke="#0066cc" strokeWidth="1" opacity="0.3" />
            <line x1="90%" y1="80%" x2="20%" y2="60%" stroke="#0066cc" strokeWidth="1" opacity="0.3" />
            <line x1="50%" y1="50%" x2="30%" y2="40%" stroke="#0066cc" strokeWidth="1" opacity="0.2" />
            <line x1="50%" y1="50%" x2="80%" y2="70%" stroke="#0066cc" strokeWidth="1" opacity="0.2" />

            {/* Network Nodes */}
            <circle
              cx="10%"
              cy="20%"
              r="8"
              fill="#0066cc"
              opacity="0.5"
              filter="url(#glow)"
            />
            <circle
              cx="40%"
              cy="70%"
              r="8"
              fill="#0066cc"
              opacity="0.5"
              filter="url(#glow)"
            />
            <circle
              cx="70%"
              cy="30%"
              r="8"
              fill="#0066cc"
              opacity="0.5"
              filter="url(#glow)"
            />
            <circle
              cx="90%"
              cy="80%"
              r="8"
              fill="#0066cc"
              opacity="0.5"
              filter="url(#glow)"
            />
            <circle
              cx="50%"
              cy="50%"
              r="10"
              fill="#0066cc"
              opacity="0.6"
              filter="url(#glow)"
            />
          </svg>

          {/* Animated Pulse Effect for Network */}
          <motion.svg
            className="absolute inset-0 w-full h-full opacity-10 dark:opacity-5"
            preserveAspectRatio="xMidYMid slice"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <defs>
              <radialGradient id="pulse" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#0066cc" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0066cc" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50%" cy="50%" r="200" fill="url(#pulse)" />
          </motion.svg>
        </div>

        {/* Floating Support Icons - Layer on Background */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          {/* Chat Bubble Icon */}
          <motion.div
            className="absolute text-4xl"
            style={{ left: '5%', top: '15%' }}
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            💬
          </motion.div>

          {/* Question Mark */}
          <motion.div
            className="absolute text-5xl opacity-40"
            style={{ right: '8%', top: '25%' }}
            animate={{ y: [0, 25, 0], x: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            ❓
          </motion.div>

          {/* Checkmark */}
          <motion.div
            className="absolute text-4xl"
            style={{ left: '12%', bottom: '20%' }}
            animate={{ y: [0, -15, 0], rotate: [0, 360, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            ✅
          </motion.div>

          {/* Headset */}
          <motion.div
            className="absolute text-4xl opacity-50"
            style={{ right: '15%', bottom: '30%' }}
            animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            🎧
          </motion.div>

          {/* Help Icon */}
          <motion.div
            className="absolute text-5xl opacity-30"
            style={{ left: '60%', top: '10%' }}
            animate={{ y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          >
            🆘
          </motion.div>

          {/* Phone Icon */}
          <motion.div
            className="absolute text-4xl"
            style={{ right: '20%', top: '15%' }}
            animate={{ y: [0, 15, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
          >
            ☎️
          </motion.div>

          {/* Message/Email */}
          <motion.div
            className="absolute text-4xl opacity-40"
            style={{ left: '8%', top: '50%' }}
            animate={{ y: [0, -18, 0], x: [0, -12, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          >
            ✉️
          </motion.div>

          {/* Light Bulb (Ideas) */}
          <motion.div
            className="absolute text-5xl opacity-35"
            style={{ right: '10%', bottom: '15%' }}
            animate={{ y: [0, 20, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          >
            💡
          </motion.div>

          {/* Hands Up Support */}
          <motion.div
            className="absolute text-4xl"
            style={{ left: '70%', bottom: '25%' }}
            animate={{ y: [0, -22, 0], x: [0, 8, 0] }}
            transition={{ duration: 4.3, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          >
            🙋
          </motion.div>
        </div>

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
            className="mb-12 text-center"
          >
            <div className="mb-6 inline-block rounded-full bg-[#0066cc]/10 px-4 py-2 dark:bg-[#0066cc]/20">
              <span className="text-sm font-semibold text-[#0066cc]">Support Center</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-6xl">
              We're <span className="bg-gradient-to-r from-[#0066cc] to-[#0066cc]/60 bg-clip-text text-transparent">Here to Help</span>
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Get instant answers or connect with our support team
            </p>
          </motion.div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <motion.div
                  key={category.title}
                  variants={itemVariants}
                  className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden hover:border-[#0066cc]/30 hover:shadow-lg transition-all"
                >
                  {/* Category Header */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full px-4 sm:px-8 py-4 sm:py-6 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <motion.div
                        className="flex-shrink-0 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#0066cc]/10"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-[#0066cc]" />
                      </motion.div>
                      <h3 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white">
                        {category.title}
                      </h3>
                    </div>
                    <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                      {category.items.length} topics
                    </span>
                  </motion.button>

                  {/* Category Items - Expandable */}
                  <div className="border-t border-neutral-200 dark:border-neutral-800 space-y-2 p-3 sm:p-4">
                    {category.items.map((item, itemIndex) => (
                      <motion.div
                        key={itemIndex}
                        className="rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50 overflow-hidden"
                      >
                        <motion.button
                          onClick={() => {
                            const key = `${category.title}-${itemIndex}`;
                            setOpenCategory(openCategory === key ? null : key);
                          }}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between gap-2 group"
                          whileHover={{ x: 3 }}
                        >
                          <span className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex-1 min-w-0 line-clamp-2">
                            {item.question}
                          </span>
                          <motion.span
                            animate={{ rotate: openCategory === `${category.title}-${itemIndex}` ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-[#0066cc] flex-shrink-0 font-bold group-hover:scale-125 transition-transform"
                          >
                            ▼
                          </motion.span>
                        </motion.button>

                        {/* Answer Content */}
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: openCategory === `${category.title}-${itemIndex}` ? 'auto' : 0,
                            opacity: openCategory === `${category.title}-${itemIndex}` ? 1 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-neutral-200 dark:border-neutral-700"
                        >
                          <p className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900/50">
                            {item.answer}
                          </p>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 px-4"
          >
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold text-neutral-950 dark:text-white">
              Contact Our Team
            </h2>
            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400">
              Choose the best way to reach us
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {channels.map((channel, index) => {
              const IconComponent = channel.icon;
              const handleClick = () => {
                if (channel.title === 'Email Support') {
                  window.location.href = `mailto:${channel.contact}`;
                } else if (channel.title === 'Phone Support') {
                  window.location.href = `tel:${channel.contact}`;
                } else if (channel.title === 'Live Chat') {
                  alert('Live chat will open shortly. Coming soon!');
                }
              };
              
              return (
                <motion.button
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClick}
                  className="relative rounded-2xl border border-[#0066cc]/30 bg-white p-6 sm:p-8 text-center hover:border-[#0066cc]/60 hover:shadow-2xl transition-all dark:border-[#0066cc]/50 dark:bg-neutral-900 dark:hover:border-[#0066cc]/70 cursor-pointer overflow-hidden group w-full"
                >
                  {/* Gradient Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0066cc]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  
                  {/* Status Indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <motion.div
                      className="h-3 w-3 rounded-full bg-green-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 hidden sm:inline">Active</span>
                  </div>

                  <motion.div
                    className="mb-4 inline-flex h-12 sm:h-14 w-12 sm:w-14 items-center justify-center rounded-full bg-[#0066cc]/10 group-hover:bg-[#0066cc]/20 transition-colors"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                  >
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-[#0066cc]" />
                  </motion.div>
                  <h3 className="mb-2 text-lg sm:text-xl font-bold text-neutral-950 dark:text-white">
                    {channel.title}
                  </h3>
                  <p className="mb-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">{channel.description}</p>
                  <motion.p
                    className="mb-3 font-semibold text-[#0066cc] break-all text-xs sm:text-base hover:underline transition-all"
                    whileHover={{ scale: 1.05 }}
                  >
                    {channel.contact}
                  </motion.p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">{channel.subtext}</p>
                  
                  {/* Interactive CTA Text */}
                  <motion.div
                    className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-xs sm:text-sm font-semibold text-[#0066cc]">
                      {channel.title === 'Email Support' ? 'Click to send email →' : channel.title === 'Phone Support' ? 'Click to call →' : 'Start conversation →'}
                    </span>
                  </motion.div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold text-neutral-950 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400">
              Find answers to your questions instantly
            </p>
          </motion.div>

          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden hover:shadow-lg hover:border-[#0066cc]/30 transition-all"
              >
                <motion.button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-4 sm:px-8 py-4 sm:py-6 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-between gap-4 group"
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    {index < 2 && (
                      <motion.span
                        className="px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-[#0066cc]/20 text-[#0066cc] flex-shrink-0"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      >
                        POPULAR
                      </motion.span>
                    )}
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-950 dark:text-white break-words">
                      {faq.question}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 ml-2"
                  >
                    <ChevronDown className="w-5 h-5 sm:w-5 sm:h-5 text-[#0066cc] group-hover:scale-125 transition-transform" />
                  </motion.div>
                </motion.button>

                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: openFaq === index ? 'auto' : 0,
                    opacity: openFaq === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-neutral-200 dark:border-neutral-800"
                >
                  <p className="px-4 sm:px-8 py-4 sm:py-6 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-gradient-to-r from-[#0066cc]/10 via-transparent to-[#0066cc]/10 dark:from-[#0066cc]/20 dark:to-[#0066cc]/20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold text-neutral-950 dark:text-white">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400">
              Send us a message and we'll get back to you within 24 hours
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onSubmit={(e) => {
              e.preventDefault();
              alert('Thank you for your message! We\'ll get back to you soon.');
              setFormData({ name: '', email: '', message: '', category: 'general' });
            }}
            className="rounded-2xl border border-[#0066cc]/30 bg-white p-6 sm:p-8 dark:border-[#0066cc]/50 dark:bg-neutral-900 space-y-6 relative overflow-hidden"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0066cc]/5 via-transparent to-[#0066cc]/10 opacity-30 -z-10 animate-pulse" />
            
            <div className="grid gap-6 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <label className="block text-sm font-semibold text-neutral-950 dark:text-white mb-2">
                  Name <span className="text-[#0066cc]">*</span>
                </label>
                <motion.input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-950 placeholder-neutral-500 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white transition-all"
                  placeholder="Your name"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <label className="block text-sm font-semibold text-neutral-950 dark:text-white mb-2">
                  Email <span className="text-[#0066cc]">*</span>
                </label>
                <motion.input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-950 placeholder-neutral-500 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white transition-all"
                  placeholder="your@email.com"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <label className="block text-sm font-semibold text-neutral-950 dark:text-white mb-2">
                Category <span className="text-[#0066cc]">*</span>
              </label>
              <motion.select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-950 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white transition-all"
              >
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Issue</option>
                <option value="booking">Booking Problem</option>
                <option value="payment">Payment Issue</option>
                <option value="feedback">Feedback</option>
              </motion.select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <label className="block text-sm font-semibold text-neutral-950 dark:text-white mb-2">
                Message <span className="text-[#0066cc]">*</span>
              </label>
              <motion.textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                rows={5}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-950 placeholder-neutral-500 focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white transition-all resize-none"
                placeholder="Tell us more about your issue..."
              />
            </motion.div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-lg bg-gradient-to-r from-[#0066cc] to-[#0052a3] px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all relative overflow-hidden group"
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform -skew-x-12 group-hover:translate-x-full" />
              <motion.span
                className="relative"
                animate={{ letterSpacing: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Send Message
              </motion.span>
            </motion.button>
          </motion.form>
        </div>
      </section>
    </main>
  );
}

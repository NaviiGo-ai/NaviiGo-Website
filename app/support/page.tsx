"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const faqs = [
  { question: "How does the AI Itinerary planner work?", answer: "Our AI engine analyzes your inputs (budget, duration, spiritual goals) and builds a custom day-by-day plan instantly, incorporating darshan timings, nearby ghats, and optimal travel routes." },
  { question: "What is the Digital Pilgrim Passport?", answer: "It's a digital logbook for your spiritual journey. When you visit verified physical locations (like specific temples), the app uses GPS to grant you digital stamps and unlock circuit milestones." },
  { question: "How do your Universal Cab Bookings work?", answer: "We ping major cab services (like Ola and Uber) in the background to find you the most cost-efficient and quickest ride directly through our platform, prioritizing your safety and schedule." },
  { question: "Can I share my itinerary with travel companions?", answer: "Yes! Every generated itinerary gets a unique shareable link. Anyone with the link can view the full plan, and signed-in users can collaborate — edits are synced in real-time via our live co-planning engine." },
  { question: "Does NaviiGo work offline or in low-connectivity areas?", answer: "Core itinerary data is cached locally once loaded, so you can reference your day-by-day plan even without internet. Live features like cab booking and weather updates require an active connection." },
  { question: "How accurate is the AI-generated itinerary?", answer: "Our AI is trained on verified travel data and updated destination databases. While it produces highly optimized plans, we always recommend double-checking timings for religious sites and festivals, as these can change." },
  { question: "Are my payments and personal data secure?", answer: "NaviiGo does not store payment details — all transactions are handled by PCI-compliant third-party gateways. Your profile data is encrypted and stored securely on Firebase, and we never sell personal information." },
  { question: "Does the app support regional languages?", answer: "English is the primary interface language right now. Regional language support (Hindi, Tamil, Bengali, and more) is actively in development and will roll out in upcoming updates." },
  { question: "How does the weather feature work?", answer: "We use the Open-Meteo API to pull live 7-day forecasts for your destination. No API key is needed — it's free and works out of the box, giving you accurate temperature, rain, and UV data." },
  { question: "How do I delete my account or data?", answer: "You can request account deletion by emailing naviigo24@gmail.com with the subject 'Delete My Account'. We'll permanently erase all your data within 7 business days, in compliance with privacy regulations." },
];

const quickActions = [
  {
    label: "Plan a Trip",
    description: "Generate a personalized AI itinerary",
    href: "/itinerary",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
    color: "blue",
  },
  {
    label: "Explore Destinations",
    description: "Discover top places across India",
    href: "/explore",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    color: "violet",
  },
  {
    label: "Digital Passport",
    description: "View your stamps & travel milestones",
    href: "/passport",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
    color: "amber",
  },
  {
    label: "My Bookings",
    description: "Track flights, hotels & cab rides",
    href: "/bookings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
      </svg>
    ),
    color: "emerald",
  },
  {
    label: "Report a Bug",
    description: "Something broken? Let us know",
    href: "https://mail.google.com/mail/?view=cm&to=naviigo24@gmail.com&su=Bug+Report+-+NaviiGo&body=Hi+NaviiGo+Team%2C%0A%0AI+found+a+bug%3A%0A%0ASteps+to+reproduce%3A%0A1.+%0A2.+%0A%0AExpected+behavior%3A%0A%0AActual+behavior%3A%0A",
    external: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.047.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-.62 3.478c-.346 1.276-1.371 2.145-2.549 2.145H6.962c-1.178 0-2.203-.87-2.549-2.145a23.912 23.912 0 01-.62-3.478A24.165 24.165 0 0112 12.75zm-3.75-4.5a3.75 3.75 0 117.5 0v2.25H8.25V8.25z" />
      </svg>
    ),
    color: "rose",
  },
  {
    label: "Request a Feature",
    description: "Share an idea to improve NaviiGo",
    href: "https://mail.google.com/mail/?view=cm&to=naviigo24@gmail.com&su=Feature+Request+-+NaviiGo&body=Hi+NaviiGo+Team%2C%0A%0AFeature+I%27d+like+to+see%3A%0A%0AWhy+it+would+be+useful%3A%0A",
    external: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    color: "sky",
  },
];

const colorMap: Record<string, string> = {
  blue:    "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20",
  violet:  "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-200 dark:group-hover:bg-violet-500/20",
  amber:   "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-500/20",
  emerald: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/20",
  rose:    "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-200 dark:group-hover:bg-rose-500/20",
  sky:     "bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-200 dark:group-hover:bg-sky-500/20",
};

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-[#070c16] pt-20 sm:pt-32 pb-24 px-4 sm:px-6 md:px-12">
      <div className="max-w-4xl mx-auto">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-black dark:text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.067a1.736 1.736 0 012.008.13c.82.596 1.82 1.187 2.547 1.187z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-4">
            How can we <span className="italic font-serif text-blue-600 dark:text-blue-500">help?</span>
          </h1>
          <p className="text-xl text-zinc-500">Our support team is here to ensure your journey is seamless.</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((action, i) => (
              <motion.a
                key={i}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.07, duration: 0.4 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="group flex items-start gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${colorMap[action.color]}`}>
                  {action.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm text-zinc-900 dark:text-white leading-snug">{action.label}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{action.description}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* FAQs */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          {faqs.map((faq, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.055 }}
              viewport={{ once: true }}
              key={i}
              className="border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-8 py-6 text-left flex justify-between items-center bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-base pr-4">{faq.question}</span>
                <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </motion.div>
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden bg-zinc-50 dark:bg-white/5"
              >
                <p className="px-8 pb-6 pt-2 text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                  {faq.answer}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
          className="mt-20 rounded-3xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] p-10 md:p-14 text-center"
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600 dark:text-blue-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Still need help?</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-8 max-w-md mx-auto">
            Can&apos;t find the answer you&apos;re looking for? Our team is just one email away.
          </p>
          <motion.a
            href="https://mail.google.com/mail/?view=cm&to=naviigo24@gmail.com&su=Support+Request+-+NaviiGo&body=Hi+NaviiGo+Team%2C%0A%0AI+need+help+with%3A%0A%0A"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Contact Support
          </motion.a>
        </motion.div>

      </div>
    </div>
  );
}

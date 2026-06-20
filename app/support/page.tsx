"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const faqs = [
  { question: "How does the AI Itinerary planner work?", answer: "Our AI engine analyzes your inputs (budget, duration, spiritual goals) and builds a custom day-by-day plan instantly, incorporating darshan timings, nearby ghats, and optimal travel routes." },
  { question: "What is the Digital Pilgrim Passport?", answer: "It's a digital logbook for your spiritual journey. When you visit verified physical locations (like specific temples), the app uses GPS to grant you digital stamps and unlock circuit milestones." },
  { question: "How do your Universal Cab Bookings work?", answer: "We ping major cab services (like Ola and Uber) in the background to find you the most cost-efficient and quickest ride directly through our platform, prioritizing your safety and schedule." }
];

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-[#070c16] pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-24"
        >
          <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-black dark:text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.067a1.736 1.736 0 012.008.13c.82.596 1.82 1.187 2.547 1.187z" /></svg>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4">How can we <span className="italic font-serif text-blue-600 dark:text-blue-500">help?</span></h1>
          <p className="text-xl text-zinc-500">Our support team is here to ensure your journey is seamless.</p>
        </motion.div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-8">Frequently Asked Questions</h2>
          {faqs.map((faq, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              key={i}
              className="border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-8 py-6 text-left flex justify-between items-center bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-lg">{faq.question}</span>
                <motion.div animate={{ rotate: open === i ? 45 : 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </motion.div>
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                className="overflow-hidden bg-zinc-50 dark:bg-white/5"
              >
                <p className="px-8 pb-6 pt-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Contact Support CTA */}
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

          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Still need help?
          </h2>
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

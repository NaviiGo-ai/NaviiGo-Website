import { FileText, CheckCircle2, AlertTriangle, Scale } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-20 bg-muted-50 dark:bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-deep-sea-100 dark:bg-deep-sea-500/10 text-deep-sea-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-muted-900 dark:text-white mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-500">Effective Date: June 2026</p>
        </div>

        <div className="prose prose-muted dark:prose-invert max-w-none space-y-12">
          <section className="bg-white dark:bg-muted-900 rounded-3xl p-8 md:p-10 border border-muted-100 dark:border-muted-800 shadow-sm">
            <h2 className="text-2xl font-bold text-muted-900 dark:text-white mb-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-deep-sea-500" />
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-600 dark:text-muted-400 leading-relaxed">
              By accessing or using the NaviiGo platform, including our website, mobile application, and AI itinerary generation tools, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to modify these terms at any time, and continued use constitutes acceptance of those changes.
            </p>
          </section>

          <section className="bg-white dark:bg-muted-900 rounded-3xl p-8 md:p-10 border border-muted-100 dark:border-muted-800 shadow-sm">
            <h2 className="text-2xl font-bold text-muted-900 dark:text-white mb-4 flex items-center gap-3">
              <Scale className="w-6 h-6 text-saffron-500" />
              2. Service Description & Booking Limitations
            </h2>
            <p className="text-muted-600 dark:text-muted-400 mb-4 leading-relaxed">
              NaviiGo operates primarily as an AI-powered travel planner and metasearch aggregator. We do not directly own or operate flights, hotels, or local transport services.
            </p>
            <ul className="list-disc pl-6 text-muted-600 dark:text-muted-400 space-y-2">
              <li><strong>Third-Party Providers:</strong> Bookings made through NaviiGo are fulfilled by third-party partners (e.g., airlines, hotel chains). Any disputes regarding service quality, cancellations, or refunds must be addressed with the respective provider.</li>
              <li><strong>Pricing Accuracy:</strong> While we strive to provide real-time pricing, fares and availability are dynamic and may change before a booking is finalized.</li>
              <li><strong>AI Itineraries:</strong> Our AI generates recommendations based on public data and traveler preferences. We do not guarantee the operating hours, safety, or availability of specific attractions.</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-muted-900 rounded-3xl p-8 md:p-10 border border-muted-100 dark:border-muted-800 shadow-sm">
            <h2 className="text-2xl font-bold text-muted-900 dark:text-white mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-temple-red-500" />
              3. User Conduct & Passport Integrity
            </h2>
            <p className="text-muted-600 dark:text-muted-400 leading-relaxed">
              The NaviiGo Digital Passport and Global Leaderboard are designed to be fun, honest representations of your travel history. Users agree not to artificially inflate their XP, use bots to automatically complete itineraries, or submit falsified location data. We reserve the right to reset accounts or ban users found violating the integrity of the gamification system.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

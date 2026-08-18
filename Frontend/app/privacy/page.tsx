import { ShieldCheck, Mail, Shield, Lock } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-20 sm:pt-28 pb-20 bg-zinc-50 dark:bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-lg text-zinc-500">Last updated: June 2026</p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12">
          <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-10 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-emerald-500" />
              1. Information We Collect
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              At NaviiGo, we prioritize your privacy. The information we collect helps us provide a seamless and personalized travel experience. This includes:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li><strong>Account Data:</strong> Name, email address, and profile picture (via Google Authentication).</li>
              <li><strong>Travel Data:</strong> Saved itineraries, bucket lists, and Passport check-ins to power our gamification and AI recommendations.</li>
              <li><strong>Usage Data:</strong> How you interact with our website to improve our services and algorithms.</li>
            </ul>
          </section>

          <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-10 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-violet-500" />
              2. How We Use Your Information
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Your data is securely stored and exclusively used to enhance your NaviiGo experience. We use your data to:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Generate hyper-personalized AI itineraries based on your past travel history and saved vibes.</li>
              <li>Maintain your digital Passport and global leaderboard rankings.</li>
              <li>Provide customer support and send critical account notifications.</li>
            </ul>
            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
              <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                <strong>Our Promise:</strong> We never sell your personal data to third parties. We only share anonymized booking metrics with travel partners (like airlines or hotels) when you make a transaction.
              </p>
            </div>
          </section>

          <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-10 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-orange-500" />
              3. Contact Us
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              If you have any questions about our privacy practices, data deletion requests, or security policies, please reach out to our privacy team.
            </p>
            <Link href="mailto:privacy@naviigo.com" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition-transform hover:scale-105 active:scale-95">
              <Mail className="w-4 h-4" />
              privacy@naviigo.com
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

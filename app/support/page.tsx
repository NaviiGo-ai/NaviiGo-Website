export default function SupportPage() {
  return (
    <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Support Center</h1>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
        How can we help you today?
      </p>
      
      <div className="mt-10 space-y-8">
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Frequently Asked Questions</h2>
          <p className="text-slate-600 dark:text-slate-400">Find answers to common questions about bookings, cancellations, and more.</p>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
          <p className="text-slate-600 dark:text-slate-400">Reach out to our support team via email or live chat.</p>
        </div>
      </div>
    </div>
  );
}

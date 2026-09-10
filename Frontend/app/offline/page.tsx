import { MapPinOff } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
        <MapPinOff className="w-10 h-10 text-slate-500" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">You&apos;re Offline</h1>
      <p className="text-slate-400 max-w-md mb-8">
        It looks like you&apos;ve lost internet connection. Don&apos;t worry, your saved itineraries and digital passport are cached securely on your device!
      </p>
      <div className="flex gap-4">
        <Link 
          href="/itinerary/ongoing"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          View My Trip
        </Link>
        <Link 
          href="/passport"
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
        >
          Open Passport
        </Link>
      </div>
    </div>
  );
}

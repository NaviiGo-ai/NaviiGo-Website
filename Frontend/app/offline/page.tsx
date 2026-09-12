import { MapPinOff } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-muted-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-muted-900 border border-muted-800 flex items-center justify-center mb-6">
        <MapPinOff className="w-10 h-10 text-muted-500" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">You&apos;re Offline</h1>
      <p className="text-muted-400 max-w-md mb-8">
        It looks like you&apos;ve lost internet connection. Don&apos;t worry, your saved itineraries and digital passport are cached securely on your device!
      </p>
      <div className="flex gap-4">
        <Link 
          href="/itinerary/ongoing"
          className="px-6 py-3 bg-deep-sea-600 hover:bg-deep-sea-700 text-white font-semibold rounded-xl transition-colors"
        >
          View My Trip
        </Link>
        <Link 
          href="/passport"
          className="px-6 py-3 bg-muted-800 hover:bg-muted-700 text-white font-semibold rounded-xl transition-colors"
        >
          Open Passport
        </Link>
      </div>
    </div>
  );
}

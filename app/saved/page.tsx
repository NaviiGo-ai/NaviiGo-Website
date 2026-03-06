"use client";

import { motion } from "framer-motion";

const savedItems = [
  { id: 1, type: "Flight", title: "DEL to VNS", date: "Oct 12 - Oct 15", price: "₹4,500", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=800&auto=format&fit=crop" },
  { id: 2, type: "Hotel", title: "Taj Lake Palace", date: "Nov 03 - Nov 06", price: "₹25,000/night", image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=800&auto=format&fit=crop" },
  { id: 3, type: "Circuit", title: "Char Dham Yatra", date: "Flexible", price: "AI Planned", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop" },
];

export default function SavedPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pt-32 px-6 md:px-12 pb-24">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 border-b border-zinc-200 dark:border-zinc-800 pb-8 flex justify-between items-end"
        >
          <div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">Your <span className="italic font-serif text-zinc-500">Saved</span> Trips.</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-lg">Pick up right where you left off.</p>
          </div>
          <button className="hidden md:block text-sm font-medium uppercase tracking-widest text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Clear All</button>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {savedItems.map((saved) => (
            <motion.div key={saved.id} variants={item} className="group cursor-pointer">
              <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
                <img src={saved.image} alt={saved.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {saved.type}
                </div>
              </div>
              <div className="flex justify-between items-start pr-4">
                <div>
                  <h3 className="text-2xl font-semibold mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{saved.title}</h3>
                  <p className="text-zinc-500 text-sm">{saved.date}</p>
                </div>
                <div className="text-lg font-medium">{saved.price}</div>
              </div>
            </motion.div>
          ))}
          
          <motion.div variants={item} className="h-64 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 hover:text-black hover:border-black dark:hover:text-white dark:hover:border-white transition-colors cursor-pointer group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            <span className="font-medium">Discover More</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

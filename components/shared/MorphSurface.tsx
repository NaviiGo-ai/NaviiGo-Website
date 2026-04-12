"use client";

import { cx } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React from "react";
import { useClickOutside } from "./use-click-outside";

const SiriOrb = ({ size }: { size?: string; colors?: Record<string, string> }) => (
  <div style={{ width: size, height: size, background: 'linear-gradient(45deg, #0ba360 0%, #3cba92 100%)', borderRadius: '50%' }} className="animate-pulse shadow-lg" />
);

const SPEED = 1;
const DOCK_HEIGHT = 44;
const DOCK_BORDER_RADIUS = 20;
const CHAT_WIDTH = 380;
const CHAT_HEIGHT = 480;
const CHAT_BORDER_RADIUS = 24;
const SPRING_STIFFNESS = 550;
const SPRING_DAMPING = 45;
const SPRING_MASS = 0.7;
const CLOSE_DELAY = 0.08;

interface FooterContext {
  showChat: boolean;
  openChat: () => void;
  closeChat: () => void;
}

const FooterContext = React.createContext({} as FooterContext);
const useFooter = () => React.useContext(FooterContext);

export function MorphSurface() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  const closeChat = React.useCallback(() => {
    setShowChat(false);
  }, []);

  const openChat = React.useCallback(() => {
    setShowChat(true);
  }, []);

  useClickOutside(rootRef, closeChat);

  const context = React.useMemo(() => ({ showChat, openChat, closeChat }), [showChat, openChat, closeChat]);

  return (
    <div
      className="flex items-center justify-center fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
      style={{
        width: showChat ? CHAT_WIDTH : 'auto',
        height: showChat ? CHAT_HEIGHT : DOCK_HEIGHT,
      }}
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
              width: showChat ? CHAT_WIDTH : 'auto',
              height: showChat ? CHAT_HEIGHT : DOCK_HEIGHT,
              borderRadius: showChat ? CHAT_BORDER_RADIUS : DOCK_BORDER_RADIUS,
            }
        }
        className={cx(
          "relative z-3 flex flex-col overflow-hidden border shadow-xl hover:shadow-2xl transition-shadow backdrop-blur-xl",
          showChat
            ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10"
            : "bg-white/80 dark:bg-black/80 border-zinc-200/50 dark:border-white/10"
        )}
        data-footer
        initial={false}
        ref={rootRef}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
              type: "spring",
              stiffness: SPRING_STIFFNESS / SPEED,
              damping: SPRING_DAMPING,
              mass: SPRING_MASS,
              delay: showChat ? 0 : CLOSE_DELAY,
              duration: 0.25,
            }
        }
      >
        <FooterContext.Provider value={context}>
          <AnimatePresence mode="wait">
            {showChat ? <ChatPanel key="chat" /> : <Dock key="dock" />}
          </AnimatePresence>
        </FooterContext.Provider>
      </motion.div>
    </div>
  );
}

/* ─── Dock (collapsed state) ─────────────────────────────────────────── */
function Dock() {
  const { openChat } = useFooter();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.footer
      className="flex h-[44px] select-none items-center justify-center whitespace-nowrap w-full cursor-pointer"
      onClick={openChat}
      initial={shouldReduceMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? {} : { opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center gap-2 px-5">
        <SiriOrb size="22px" />
        <span className="truncate pr-2 font-medium text-sm text-zinc-700 dark:text-zinc-300">Ask AI</span>
      </div>
    </motion.footer>
  );
}

/* ─── Chat Panel (expanded state) ────────────────────────────────────── */
function ChatPanel() {
  const { closeChat } = useFooter();
  const shouldReduceMotion = useReducedMotion();
  const [messages, setMessages] = React.useState<{ role: 'ai' | 'user'; text: string }[]>([
    {
      role: 'ai',
      text: "Namaste! 🙏 I'm your NaviiGo AI travel assistant. Ask me about:\n• Best time to visit a destination\n• Temple darshan timings\n• Budget-friendly travel tips\n• Hidden gems & local food",
    },
  ]);
  const [input, setInput] = React.useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    // Simulated AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        'default': `Great question about "${userMsg}"! I'd recommend checking our Explore page for curated destinations. You can also use the itinerary planner to build a detailed trip.`,
      };

      const lower = userMsg.toLowerCase();
      let reply = responses.default;
      if (lower.includes('temple') || lower.includes('darshan')) {
        reply = "🛕 Most major temples open at 6 AM and close by 9 PM, with a break from 12–4 PM. I'd recommend visiting during weekday mornings for shorter queues. Want me to plan a temple circuit?";
      } else if (lower.includes('budget') || lower.includes('cheap')) {
        reply = "💰 For budget travel, consider:\n• Travel during off-season (Jul-Sep for most places)\n• Book trains via IRCTC 2 months ahead\n• Stay in hostels (₹300-800/night)\n• Eat at local dhabas\nWant me to build an itinerary within your budget?";
      } else if (lower.includes('goa') || lower.includes('beach')) {
        reply = "🏖️ Goa is perfect from Nov-Feb! South Goa for peace, North Goa for nightlife. Don't miss:\n• Palolem Beach\n• Old Goa churches\n• Saturday Night Market\nBudget: ₹12k-30k for 3-5 days.";
      } else if (lower.includes('hidden') || lower.includes('gem')) {
        reply = "💎 Top hidden gems:\n• Spiti Valley — Himalayan moonscape\n• Majuli Island — World's largest river island\n• Gokarna — Pristine beaches without Goa crowds\n• Ziro Valley — UNESCO site in Arunachal\nCheck our Hidden Gems section on the Explore page!";
      } else if (lower.includes('food') || lower.includes('cuisine')) {
        reply = "🍛 India's food regions to explore:\n• Punjab — Butter Chicken, Chole Bhature\n• Kerala — Appam, Fish Curry\n• Bengal — Macher Jhol, Mishti Doi\n• Rajasthan — Dal Baati Churma\nTry our Cuisines section on the Explore page!";
      }

      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    }, 800);
  };

  const quickPrompts = ['Best temples in South India?', 'Budget trip to Varanasi?', 'Weekend getaway ideas'];

  return (
    <motion.div
      className="flex flex-col h-full w-full"
      initial={shouldReduceMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? {} : { opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-100 dark:border-white/5 shrink-0">
        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
          <span className="text-lg">🤖</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">NaviiGo AI</h3>
          <p className="text-[11px] text-emerald-500 font-medium">Online • Ready to help</p>
        </div>
        <button
          onClick={closeChat}
          className="w-7 h-7 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center text-zinc-400 text-sm transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px]">✨</span>
              </div>
            )}
            <div
              className={cx(
                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line",
                msg.role === 'ai'
                  ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-tl-md"
                  : "bg-emerald-600 text-white rounded-tr-md ml-auto"
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />

        {/* Quick prompts (only show when there is 1 message) */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickPrompts.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-[11px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-full px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-zinc-100 dark:border-white/5 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-3.5 py-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your trip…"
            className="flex-1 bg-transparent text-sm outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
          />
          <button
            type="submit"
            className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition-colors flex-shrink-0 disabled:opacity-40"
            disabled={!input.trim()}
          >
            <span className="text-sm">↑</span>
          </button>
        </form>
      </div>
    </motion.div>
  );
}

export default MorphSurface;
"use client";

import { cx } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React from "react";
import { useClickOutside } from "./use-click-outside";
import { useAI } from "@/context/AIContext";
import { Sparkles, X, Send, Bot, Calendar, Trash2, ArrowRight } from "lucide-react";

const SiriOrb = ({ size }: { size?: string }) => (
  <div 
    style={{ width: size, height: size, background: 'linear-gradient(45deg, #0ba360 0%, #3cba92 100%)', borderRadius: '50%' }} 
    className="animate-pulse shadow-lg shadow-emerald-500/20" 
  />
);

const SPEED = 1;
const DOCK_HEIGHT = 44;
const DOCK_BORDER_RADIUS = 20;
const CHAT_WIDTH = 380;
const CHAT_HEIGHT = 520;
const CHAT_BORDER_RADIUS = 24;
const SPRING_STIFFNESS = 550;
const SPRING_DAMPING = 45;
const SPRING_MASS = 0.7;
const CLOSE_DELAY = 0.08;

export function MorphSurface() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const { isOpen, openAI, closeAI, itineraryContext } = useAI();
  const shouldReduceMotion = useReducedMotion();

  useClickOutside(rootRef, closeAI);

  return (
    <div
      className="flex items-center justify-center fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
      style={{
        width: isOpen ? CHAT_WIDTH : 'auto',
        height: isOpen ? CHAT_HEIGHT : DOCK_HEIGHT,
      }}
    >
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
              width: isOpen ? CHAT_WIDTH : 'auto',
              height: isOpen ? CHAT_HEIGHT : DOCK_HEIGHT,
              borderRadius: isOpen ? CHAT_BORDER_RADIUS : DOCK_BORDER_RADIUS,
            }
        }
        className={cx(
          "relative z-3 flex flex-col overflow-hidden border shadow-2xl transition-shadow backdrop-blur-2xl px-1",
          isOpen
            ? "bg-zinc-950/95 border-white/10"
            : "bg-black/90 border-white/10 hover:border-emerald-500/30"
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
              delay: isOpen ? 0 : CLOSE_DELAY,
              duration: 0.25,
            }
        }
      >
        <AnimatePresence mode="wait">
          {isOpen ? <ChatPanel key="chat" /> : <Dock key="dock" />}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Dock() {
  const { openAI, itineraryContext } = useAI();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.footer
      className="flex h-[44px] select-none items-center justify-center whitespace-nowrap w-full cursor-pointer"
      onClick={openAI}
      initial={shouldReduceMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? {} : { opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center gap-2.5 px-5">
        <SiriOrb size="20px" />
        <span className="font-bold text-xs tracking-wide text-zinc-300 uppercase">
          {itineraryContext ? 'Plan Assistant' : 'Ask AI'}
        </span>
        {itineraryContext && (
          <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
            <Sparkles className="w-2.5 h-2.5" /> Live
          </div>
        )}
      </div>
    </motion.footer>
  );
}

function ChatPanel() {
  const { closeAI, messages, sendMessage, itineraryContext, applyAction, lastAction, clearLastAction } = useAI();
  const shouldReduceMotion = useReducedMotion();
  const [input, setInput] = React.useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const quickPrompts = itineraryContext 
    ? ['🍽️ More food stops', '🚶 Less walking', '💰 Make it cheaper', '✨ Add hidden gem']
    : ['Best temples in Kashi?', 'Budget trip to Goa?', 'Hidden gems in Spiti'];

  const handleAcceptAction = React.useCallback(() => {
      if (!lastAction) return;
      applyAction({ type: lastAction.type, payload: lastAction.payload });
      clearLastAction();
  }, [lastAction, applyAction, clearLastAction]);

  // Detect if an AI message suggests adding/removing something
  const detectSuggestion = React.useCallback((text: string): { type: 'add' | 'remove' | null; name: string; dayIndex: number } => {
    // Extract day number if mentioned (default to 0)
    const dayMatch = text.match(/Day\s*(\d+)/i);
    const dayIndex = dayMatch ? parseInt(dayMatch[1], 10) - 1 : 0; // Day 1 = index 0

    // Broad add detection
    const addPatterns = [
      /(?:add|include|insert|try adding)\s+(?:a\s+)?(.+?)(?:\s+to\s+(?:your|the)\s+(?:Day|itinerary))/i,
      /I'?d\s+love\s+to\s+add\s+(.+?)(?:\s+to\s+your)/i,
      /(?:recommend|suggest)(?:ing)?\s+(?:adding\s+)?(.+?)(?:\s+(?:to|for)\s+(?:your|Day))/i,
      /(?:how about|what about|consider)\s+(?:adding\s+)?(.+?)(?:\s+(?:to|on|for)\s+)/i,
      /Let'?s\s+add\s+(.+?)(?:\s+(?:to|on|for)\s+)/i,
      /(?:adding|add)\s+(.+?)(?:\s+(?:would|could|will|as))/i,
    ];
    for (const pat of addPatterns) {
      const m = text.match(pat);
      if (m) return { type: 'add', name: m[1].replace(/["""*_]/g, '').trim(), dayIndex };
    }

    // Broad remove detection
    const removePatterns = [
      /(?:remove|drop|skip|cut|take out)\s+(?:the\s+)?(.+?)(?:\s+(?:from|on)\s+(?:your|the|Day))/i,
      /(?:removing|remove)\s+(.+?)(?:\s+(?:would|could|will|to))/i,
    ];
    for (const pat of removePatterns) {
      const m = text.match(pat);
      if (m) return { type: 'remove', name: m[1].replace(/["""*_]/g, '').trim(), dayIndex };
    }

    return { type: null, name: '', dayIndex: 0 };
  }, []);

  const handleQuickAdd = React.useCallback((name: string, dayIndex: number) => {
    if (!itineraryContext?.dayPlans) return;
    // Clamp dayIndex to valid range
    const di = Math.min(dayIndex, (itineraryContext.dayPlans.length || 1) - 1);
    if (!itineraryContext.dayPlans[di]) return;
    applyAction({
      type: 'addActivity',
      payload: {
        dayIndex: di,
        activity: {
          name, desc: `Added via AI recommendation`, time: '05:00 PM',
          slot: 'Evening', crowd: 'Medium', crowdTip: 'AI suggested',
          lat: itineraryContext.mapCenter?.lat || 0,
          lng: itineraryContext.mapCenter?.lng || 0,
        }
      }
    });
  }, [itineraryContext, applyAction]);

  const handleQuickRemove = React.useCallback((name: string) => {
    if (!itineraryContext?.dayPlans) return;
    for (let d = 0; d < itineraryContext.dayPlans.length; d++) {
      const acts = itineraryContext.dayPlans[d].activities || [];
      const idx = acts.findIndex((a: any) => a.name.toLowerCase().includes(name.toLowerCase()));
      if (idx >= 0) {
        applyAction({ type: 'removeActivity', payload: { dayIndex: d, activityIndex: idx } });
        return;
      }
    }
  }, [itineraryContext, applyAction]);

  return (
    <motion.div
      className="flex flex-col h-full w-full"
      initial={shouldReduceMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? {} : { opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 shrink-0">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Bot className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-xs uppercase tracking-widest text-white">NaviiGo AI</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">Active Awareness</p>
          </div>
        </div>
        <button
          onClick={closeAI}
          className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => {
          const suggestion = msg.role === 'ai' && itineraryContext ? detectSuggestion(msg.text) : { type: null, name: '', dayIndex: 0 };
          return (
          <div key={i} className="space-y-2">
            <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            )}
            <div
              className={cx(
                "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm",
                msg.role === 'ai'
                  ? "bg-zinc-900 border border-white/5 text-zinc-300 rounded-tl-md"
                  : "bg-emerald-600 text-white rounded-tr-md ml-auto font-medium"
              )}
            >
              {msg.text}
            </div>
          </div>
          {/* Inline action buttons when AI suggests add/remove */}
          {suggestion.type && suggestion.name && (
            <div className="ml-10 flex gap-2">
              {suggestion.type === 'add' && (
                <button
                  onClick={() => handleQuickAdd(suggestion.name, suggestion.dayIndex)}
                  className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl px-3 py-1.5 hover:bg-emerald-500/30 transition-colors"
                >
                  <span className="text-sm">➕</span> Add {suggestion.name.length > 20 ? suggestion.name.slice(0, 20) + '…' : suggestion.name}
                </button>
              )}
              {suggestion.type === 'remove' && (
                <button
                  onClick={() => handleQuickRemove(suggestion.name)}
                  className="flex items-center gap-1.5 text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl px-3 py-1.5 hover:bg-red-500/30 transition-colors"
                >
                  <span className="text-sm">➖</span> Remove {suggestion.name.length > 20 ? suggestion.name.slice(0, 20) + '…' : suggestion.name}
                </button>
              )}
            </div>
          )}
          </div>
        );
        })}

        {/* Pending Action Banner */}
        <AnimatePresence>
            {lastAction && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mt-2 shadow-sm">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Suggests a Change
                    </p>
                    <p className="text-xs font-semibold text-zinc-200 mb-3">{lastAction.description}</p>
                    <div className="flex gap-2">
                        <button onClick={handleAcceptAction}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold rounded-xl py-2 transition-colors">
                            ✓ Apply Change
                        </button>
                        <button onClick={clearLastAction}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold rounded-xl py-2 transition-colors">
                            ✕ Skip
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-5 pb-2">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-[10px] font-bold uppercase tracking-wide bg-zinc-900 border border-white/5 rounded-full px-3.5 py-2 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-2xl pl-4 pr-1.5 py-1.5 focus-within:border-emerald-500/50 transition-colors"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Help me with my trip..."
            className="flex-1 bg-transparent text-sm outline-none text-zinc-200 placeholder:text-zinc-600 font-medium"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition-all flex-shrink-0 disabled:opacity-40 disabled:scale-95"
            disabled={!input.trim()}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}

export default MorphSurface;

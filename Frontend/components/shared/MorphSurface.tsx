"use client";

import { cx } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React from "react";
import { useClickOutside } from "./use-click-outside";
import { useAI } from "@/context/AIContext";
import { Sparkles, X, Send, Bot } from "lucide-react";

const SiriOrb = ({ size }: { size?: string }) => (
  <div 
    style={{ width: size, height: size, background: 'linear-gradient(45deg, var(--primary) 0%, oklch(0.60 0.14 165) 100%)', borderRadius: '50%' }} 
    className="animate-pulse shadow-md shadow-primary/20" 
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
  const { isOpen, closeAI } = useAI();
  const shouldReduceMotion = useReducedMotion();

  useClickOutside(rootRef, closeAI);

  return (
    <div
      className="flex items-center justify-center fixed bottom-4 right-4 sm:bottom-6 sm:right-8 z-[100] max-w-[calc(100vw-32px)]"
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
          "relative z-3 flex flex-col overflow-hidden border shadow-2xl transition-all backdrop-blur-2xl px-1",
          isOpen
            ? "bg-card/95 border-border text-card-foreground"
            : "bg-card/90 border-border hover:border-primary/40 text-card-foreground"
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
        <span className="font-bold text-xs tracking-wide text-foreground uppercase">
          {itineraryContext ? 'Plan Assistant' : 'Ask AI'}
        </span>
        {itineraryContext && (
          <div className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
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
    const dayMatch = text.match(/Day\s*(\d+)/i);
    const dayIndex = dayMatch ? parseInt(dayMatch[1], 10) - 1 : 0;

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
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs uppercase tracking-widest text-foreground font-sans">NaviiGo AI</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] text-primary font-bold uppercase tracking-tight">Active Awareness</p>
          </div>
        </div>
        <button
          onClick={closeAI}
          className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary/30 text-primary">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={cx(
                "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-xs",
                msg.role === 'ai'
                  ? "bg-muted border border-border text-foreground rounded-tl-md"
                  : "bg-primary text-primary-foreground rounded-tr-md ml-auto font-medium"
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
                  className="flex items-center gap-1.5 text-[11px] font-bold bg-primary/20 text-primary border border-primary/30 rounded-xl px-3 py-1.5 hover:bg-primary/30 transition-colors"
                >
                  <span className="text-sm">➕</span> Add {suggestion.name.length > 20 ? suggestion.name.slice(0, 20) + '…' : suggestion.name}
                </button>
              )}
              {suggestion.type === 'remove' && (
                <button
                  onClick={() => handleQuickRemove(suggestion.name)}
                  className="flex items-center gap-1.5 text-[11px] font-bold bg-destructive/20 text-destructive border border-destructive/30 rounded-xl px-3 py-1.5 hover:bg-destructive/30 transition-colors"
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
                    className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mt-2 shadow-xs">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Suggests a Change
                    </p>
                    <p className="text-xs font-semibold text-foreground mb-3">{lastAction.description}</p>
                    <div className="flex gap-2">
                        <button onClick={handleAcceptAction}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold rounded-xl py-2 transition-colors">
                            ✓ Apply Change
                        </button>
                        <button onClick={clearLastAction}
                            className="flex-1 bg-muted hover:bg-accent text-foreground text-[11px] font-bold rounded-xl py-2 transition-colors border border-border">
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
              className="text-[10px] font-bold uppercase tracking-wide bg-secondary text-secondary-foreground border border-border rounded-full px-3.5 py-2 hover:bg-accent hover:text-accent-foreground transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 bg-input border border-border rounded-2xl pl-4 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-ring transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Help me with my trip..."
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground font-medium"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all flex-shrink-0 disabled:opacity-40 disabled:scale-95"
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

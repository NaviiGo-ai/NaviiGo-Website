'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AIMessage = {
  role: 'ai' | 'user';
  text: string;
};

interface AIContextType {
  isOpen: boolean;
  messages: AIMessage[];
  itineraryContext: any | null; // Placeholder for itinerary data
  openAI: () => void;
  closeAI: () => void;
  sendMessage: (text: string) => Promise<void>;
  registerItinerary: (data: any, updater: (newData: any) => void) => void;
  applyAction: (action: string) => Promise<void>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'ai',
      text: "Namaste! 🙏 I'm your NaviiGo AI travel assistant. Ask me anything about your trip, or if you're on the itinerary page, I can help you modify your plans!",
    },
  ]);
  const [itinerary, setItinerary] = useState<any | null>(null);
  const [itineraryUpdater, setItineraryUpdater] = useState<((data: any) => void) | null>(null);

  const openAI = useCallback(() => setIsOpen(true), []);
  const closeAI = useCallback(() => setIsOpen(false), []);

  const registerItinerary = useCallback((data: any, updater: (newData: any) => void) => {
    setItinerary(data);
    setItineraryUpdater(() => updater);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, itineraryContext: itinerary })
      });
      const data = await response.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      }
    } catch (err) {
      console.error('AI Chat error:', err);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having a bit of trouble connecting right now. Please try again in a moment! 🙏" }]);
    }
  }, [itinerary]);

  const applyAction = useCallback(async (action: string) => {
      // Logic for itinerary actions (e.g., delete, optimize)
      // This will be called by the MorphSurface when AI suggests an action
      if (itineraryUpdater && itinerary) {
          // Placeholder for complex logic
          console.log("Applying AI action:", action);
      }
  }, [itinerary, itineraryUpdater]);

  return (
    <AIContext.Provider value={{ 
      isOpen, 
      messages, 
      itineraryContext: itinerary, 
      openAI, 
      closeAI, 
      sendMessage, 
      registerItinerary,
      applyAction
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

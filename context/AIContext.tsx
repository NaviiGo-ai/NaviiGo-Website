'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AIMessage = {
  role: 'ai' | 'user';
  text: string;
};

interface AIContextType {
  isOpen: boolean;
  messages: AIMessage[];
  itineraryContext: any | null;
  openAI: () => void;
  closeAI: () => void;
  sendMessage: (text: string) => Promise<void>;
  registerItinerary: (data: any, updater: (newData: any) => void) => void;
  applyAction: (action: { type: string; payload: any }) => void;
  isEditPanelOpen: boolean;
  openEditPanel: () => void;
  closeEditPanel: () => void;
  lastAction: { type: string; payload: any; description: string } | null;
  clearLastAction: () => void;
  editMessages: AIMessage[];
  sendEditMessage: (text: string) => Promise<{ reply: string; action: any } | null>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'ai',
      text: "Namaste! 🙏 I'm your NaviiGo AI travel assistant. Ask me anything about your trip, or if you're on the itinerary page, I can help you modify your plans!",
    },
  ]);
  const [editMessages, setEditMessages] = useState<AIMessage[]>([
    { role: 'ai', text: "Hi! ✈️ Tell me how you'd like to change your itinerary. Try: \"Remove the temple on day 2\", \"Add a local food market\", or \"Make day 1 more relaxing\"." }
  ]);
  const [itinerary, setItinerary] = useState<any | null>(null);
  const [itineraryUpdater, setItineraryUpdater] = useState<((data: any) => void) | null>(null);
  const [lastAction, setLastAction] = useState<{ type: string; payload: any; description: string } | null>(null);

  const openAI = useCallback(() => setIsOpen(true), []);
  const closeAI = useCallback(() => setIsOpen(false), []);
  const openEditPanel = useCallback(() => setIsEditPanelOpen(true), []);
  const closeEditPanel = useCallback(() => setIsEditPanelOpen(false), []);
  const clearLastAction = useCallback(() => setLastAction(null), []);

  const registerItinerary = useCallback((data: any, updater: (newData: any) => void) => {
    setItinerary(data);
    setItineraryUpdater(() => updater);
  }, []);

  /** Apply a structured action from AI to the itinerary data */
  const applyAction = useCallback((action: { type: string; payload: any }) => {
    if (!itinerary || !itineraryUpdater) return;

    const updated = structuredClone(itinerary);

    switch (action.type) {
      case 'removeActivity': {
        const { dayIndex, activityIndex } = action.payload;
        if (updated.dayPlans?.[dayIndex]?.activities) {
          updated.dayPlans[dayIndex].activities.splice(activityIndex, 1);
        }
        break;
      }
      case 'addActivity': {
        const { dayIndex, activity } = action.payload;
        if (updated.dayPlans?.[dayIndex]) {
          updated.dayPlans[dayIndex].activities.push(activity);
          // Sort by time slot
          const slotOrder: Record<string, number> = { Morning: 0, Afternoon: 1, Evening: 2 };
          updated.dayPlans[dayIndex].activities.sort((a: any, b: any) =>
            (slotOrder[a.slot] ?? 1) - (slotOrder[b.slot] ?? 1)
          );
        }
        break;
      }
      case 'replaceActivity': {
        const { dayIndex, activityIndex, activity } = action.payload;
        if (updated.dayPlans?.[dayIndex]?.activities?.[activityIndex]) {
          updated.dayPlans[dayIndex].activities[activityIndex] = {
            ...updated.dayPlans[dayIndex].activities[activityIndex],
            ...activity,
          };
        }
        break;
      }
      case 'reorderDay': {
        const { dayIndex, fromIndex, toIndex } = action.payload;
        if (updated.dayPlans?.[dayIndex]?.activities) {
          const acts = updated.dayPlans[dayIndex].activities;
          const [moved] = acts.splice(fromIndex, 1);
          acts.splice(toIndex, 0, moved);
        }
        break;
      }
      case 'addDay': {
        const { day } = action.payload;
        if (updated.dayPlans) {
          updated.dayPlans.push(day);
        }
        break;
      }
      case 'changeHotel': {
        const { hotelIndex, newHotel } = action.payload;
        if (updated.hotels?.[hotelIndex]) {
          updated.hotels[hotelIndex] = { ...updated.hotels[hotelIndex], ...newHotel };
        }
        break;
      }
      case 'swapRestaurant': {
        const { dayIndex, activityIndex, newRestaurant } = action.payload;
        if (updated.dayPlans?.[dayIndex]?.activities?.[activityIndex]) {
          const act = updated.dayPlans[dayIndex].activities[activityIndex];
          updated.dayPlans[dayIndex].activities[activityIndex] = {
            ...act,
            name: `${act.type === 'restaurant' ? 'Lunch at ' : ''}${newRestaurant.name}`,
            desc: `${newRestaurant.desc}. Must try: ${newRestaurant.mustTry}`,
          };
        }
        break;
      }
      case 'surpriseActivity': {
        const { dayIndex } = action.payload;
        if (updated.dayPlans?.[dayIndex]?.activities?.length > 0) {
          // Replace a random afternoon activity
          const acts = updated.dayPlans[dayIndex].activities;
          const idx = acts.findIndex((a: any) => a.slot === 'Afternoon' && a.type !== 'restaurant') || 1;
          if (acts[idx]) {
            acts[idx] = {
              ...acts[idx],
              name: '🎲 Surprise Local Experience',
              desc: 'NaviiGo found you something unexpected — a local hidden gem most tourists never discover.',
              crowd: 'Low',
              crowdTip: 'Almost nobody knows about this one!',
            };
          }
        }
        break;
      }
    }

    setItinerary(updated);
    itineraryUpdater(updated);
  }, [itinerary, itineraryUpdater]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);

    try {
      const baseUrl = '';
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, itineraryContext: itinerary, context: messages.slice(-6) })
      });
      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having a bit of trouble connecting right now. Please try again in a moment! 🙏" }]);
    }
  }, [itinerary, messages]);

  /** Send a message in the inline itinerary edit panel */
  const sendEditMessage = useCallback(async (text: string): Promise<{ reply: string; action: any } | null> => {
    if (!text.trim()) return null;
    setEditMessages(prev => [...prev, { role: 'user', text }]);

    try {
      const baseUrl = '';
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          itineraryContext: itinerary,
          context: editMessages.slice(-8),
        })
      });
      const data = await response.json();
      if (data.reply) {
        setEditMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      }
      if (data.action) {
        setLastAction({
          type: data.action.type,
          payload: data.action.payload,
          description: data.reply || 'AI wants to modify your itinerary',
        });
      }
      return { reply: data.reply, action: data.action };
    } catch {
      setEditMessages(prev => [...prev, { role: 'ai', text: "Connection issue — please try again." }]);
      return null;
    }
  }, [itinerary, editMessages]);

  return (
    <AIContext.Provider value={{
      isOpen,
      messages,
      itineraryContext: itinerary,
      openAI,
      closeAI,
      sendMessage,
      registerItinerary,
      applyAction,
      isEditPanelOpen,
      openEditPanel,
      closeEditPanel,
      lastAction,
      clearLastAction,
      editMessages,
      sendEditMessage,
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

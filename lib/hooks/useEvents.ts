'use client';

import { useState, useEffect } from 'react';
import { LocalEvent } from '@/lib/api/googleEvents';

const eventsCache = new Map<string, LocalEvent[]>();

export function useEvents(destination: string) {
  const cacheKey = destination.toLowerCase();
  const [events, setEvents] = useState<LocalEvent[]>(() => eventsCache.get(cacheKey) || []);
  const [loading, setLoading] = useState(!eventsCache.has(cacheKey));

  useEffect(() => {
    if (!destination) return;

    if (eventsCache.has(cacheKey)) {
      setEvents(eventsCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch('/api/explore/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json();
        if (res.ok && json.events) {
          eventsCache.set(cacheKey, json.events);
          setEvents(json.events);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('[useEvents] Fetch error:', err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [destination, cacheKey]);

  return { events, loading };
}

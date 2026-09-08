'use client';

import { useState, useEffect } from 'react';
import { DeepDiveResponse } from '@/types';

const deepDiveCache = new Map<string, DeepDiveResponse>();

export function useDeepDive(destination: string, companion: string, vibe: string) {
  const cacheKey = `${destination.toLowerCase()}-${companion}-${vibe}`;
  const [data, setData] = useState<DeepDiveResponse | null>(() => deepDiveCache.get(cacheKey) || null);
  const [loading, setLoading] = useState(!deepDiveCache.has(cacheKey));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!destination) return;

    if (deepDiveCache.has(cacheKey)) {
      setData(deepDiveCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetch('/api/explore/deep-dive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, companion, vibe }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json();
        if (res.ok) {
          deepDiveCache.set(cacheKey, json);
          setData(json);
        } else {
          setError(json.error || 'Failed to analyze destination');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Network error fetching deep dive');
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
  }, [destination, companion, vibe, cacheKey]);

  return { data, loading, error };
}

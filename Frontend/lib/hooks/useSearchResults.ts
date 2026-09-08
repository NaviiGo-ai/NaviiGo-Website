'use client';

import { useState, useCallback } from 'react';
import { SearchApiRequest } from '@/types';

const searchCache = new Map<string, any[]>();

export function useSearchResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeSearch = useCallback(async (params: SearchApiRequest) => {
    const cacheKey = `${params.type}-${params.from}-${params.to}-${params.date}-${params.travelers || 1}-p${params.page || 1}`;

    if (searchCache.has(cacheKey)) {
      setResults(searchCache.get(cacheKey)!);
      return searchCache.get(cacheKey)!;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const json = await res.json();
      if (res.ok && json.results) {
        searchCache.set(cacheKey, json.results);
        setResults(json.results);
        return json.results;
      } else {
        setError(json.error || 'Search failed');
        setResults([]);
        return [];
      }
    } catch (e: any) {
      setError(e.message || 'Network error executing search');
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, executeSearch };
}

/**
 * React hook for managing stock OHLCV data state
 * Handles fetching, loading states, and errors with automatic refetch on dependency changes
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchOHLCV } from '../services/api';
import type { OHLCVResponse, Period, APIError } from '../types/stock';

interface UseStockDataState {
  data: OHLCVResponse | null;
  loading: boolean;
  error: APIError | null;
}

interface UseStockDataReturn extends UseStockDataState {
  refetch: () => Promise<void>;
}

const MISSING_TICKER_ERROR: APIError = { message: 'Ticker symbol is required' };
const STOCK_DATA_CACHE_TTL_MS = 5 * 60 * 1000;
const STOCK_DATA_CACHE_MAX_ENTRIES = 120;

interface CachedStockData {
  data: OHLCVResponse;
  cachedAt: number;
}

// Shared in-memory cache across hook instances.
const stockDataCache = new Map<string, CachedStockData>();

const getCacheKey = (ticker: string, period: Period): string => `${ticker}:${period}`;

const isCacheFresh = (entry: CachedStockData): boolean =>
  Date.now() - entry.cachedAt <= STOCK_DATA_CACHE_TTL_MS;

function setCachedStockData(cacheKey: string, data: OHLCVResponse): void {
  // Re-insert existing keys to keep insertion order as a simple LRU approximation.
  if (stockDataCache.has(cacheKey)) {
    stockDataCache.delete(cacheKey);
  }

  stockDataCache.set(cacheKey, {
    data,
    cachedAt: Date.now(),
  });

  if (stockDataCache.size > STOCK_DATA_CACHE_MAX_ENTRIES) {
    const oldestKey = stockDataCache.keys().next().value;
    if (oldestKey) {
      stockDataCache.delete(oldestKey);
    }
  }
}

function normalizeAPIError(err: unknown): APIError {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const candidate = err as APIError;
    return {
      message: candidate.message || 'Failed to fetch stock data',
      status: candidate.status,
      details: candidate.details ?? err,
    };
  }

  return {
    message: 'Failed to fetch stock data',
    details: err,
  };
}

/**
 * Custom hook for fetching and managing stock OHLCV data
 *
 * @param ticker - Stock symbol to fetch data for
 * @param period - Time period for historical data
 * @returns Object containing data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useStockData('AAPL', '1mo');
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error.message} />;
 * if (!data) return null;
 *
 * return <CandlestickChart data={data.data} />;
 * ```
 */
export function useStockData(ticker: string, period: Period): UseStockDataReturn {
  const normalizedTicker = ticker.trim().toUpperCase();
  const missingTicker = normalizedTicker.length === 0;
  const cacheKey = getCacheKey(normalizedTicker, period);

  const [state, setState] = useState<UseStockDataState>({
    data: null,
    loading: false,
    error: null,
  });

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    if (missingTicker) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: MISSING_TICKER_ERROR,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetchOHLCV(normalizedTicker, period);
      setCachedStockData(cacheKey, response);
      setState({ data: response, loading: false, error: null });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;

      const apiError = normalizeAPIError(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: apiError,
      }));
    }
  }, [cacheKey, missingTicker, normalizedTicker, period]);

  // Auto-fetch on ticker/period change
  useEffect(() => {
    if (missingTicker) return;

    const cachedEntry = stockDataCache.get(cacheKey);
    if (cachedEntry && isCacheFresh(cachedEntry)) {
      const cacheUpdateTimeout = setTimeout(() => {
        setState({
          data: cachedEntry.data,
          loading: false,
          error: null,
        });
      }, 0);

      return () => {
        clearTimeout(cacheUpdateTimeout);
      };
    }

    const abortController = new AbortController();

    const fetchData = async () => {
      // If stale cache exists, keep showing it while refreshing in the background.
      setState((prev) => ({
        data: cachedEntry?.data ?? prev.data,
        loading: true,
        error: null,
      }));

      try {
        const response = await fetchOHLCV(normalizedTicker, period, abortController.signal);

        if (!abortController.signal.aborted) {
          setCachedStockData(cacheKey, response);
          setState({
            data: response,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }

        const apiError = normalizeAPIError(err);

        if (!abortController.signal.aborted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: apiError,
          }));
        }
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [cacheKey, missingTicker, normalizedTicker, period]);

  return {
    data: missingTicker ? null : state.data,
    loading: missingTicker ? false : state.loading,
    error: missingTicker ? MISSING_TICKER_ERROR : state.error,
    refetch,
  };
}

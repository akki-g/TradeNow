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
  const [state, setState] = useState<UseStockDataState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!ticker) {
      setState({
        data: null,
        loading: false,
        error: { message: 'Ticker symbol is required' },
      });
      return;
    }

    const abortController = new AbortController();

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetchOHLCV(ticker, period, abortController.signal);

      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted) {
        setState({
          data: response,
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      // Ignore abort errors - they're expected when switching tickers
      if ((err as Error).name === 'AbortError') {
        return;
      }

      const apiError = err as APIError;
      if (!abortController.signal.aborted) {
        setState({
          data: null,
          loading: false,
          error: {
            message: apiError.message || 'Failed to fetch stock data',
            status: apiError.status,
            details: apiError.details,
          },
        });
      }
    }

    // Return cleanup function
    return () => {
      abortController.abort();
    };
  }, [ticker, period]);

  // Wrapper for refetch that doesn't expose the cleanup function
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    fetchData().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
    };
  }, [fetchData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}

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

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    if (!ticker) {
      setState({
        data: null,
        loading: false,
        error: { message: 'Ticker symbol is required' },
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      console.log('[useStockData] Manual refetch for', { ticker, period });
      const response = await fetchOHLCV(ticker, period);
      setState({ data: response, loading: false, error: null });
    } catch (err) {
      const apiError = err as APIError;
      console.error('[useStockData] Refetch error:', apiError);
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
  }, [ticker, period]);

  // Auto-fetch on ticker/period change
  useEffect(() => {
    if (!ticker) {
      setState({
        data: null,
        loading: false,
        error: { message: 'Ticker symbol is required' },
      });
      return;
    }

    const abortController = new AbortController();

    const fetchData = async () => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        console.log('[useStockData] Fetching data for', { ticker, period });
        const response = await fetchOHLCV(ticker, period, abortController.signal);

        console.log('[useStockData] Data fetched successfully', {
          ticker: response.ticker,
          dataPoints: response.data.length,
          period: response.period,
        });

        if (!abortController.signal.aborted) {
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

        const apiError = err as APIError;
        console.error('[useStockData] Error fetching data:', {
          ticker,
          period,
          error: apiError,
        });

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
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [ticker, period]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}

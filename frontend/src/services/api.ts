/**
 * API Client for trading platform backend
 * Handles all HTTP communication with the FastAPI backend
 * Includes runtime type validation and request cancellation support
 */

import { z } from 'zod';
import type { OHLCVResponse, StockInfo, Period, APIError } from '../types/stock';
import { OHLCVResponseSchema, StockInfoSchema } from '../types/stock';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL;
  }

  private createURL(path: string, params?: Record<string, string>): string {
    const url = new URL(`${API_PREFIX}${path}`, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  private isAPIError(error: unknown): error is APIError {
    if (typeof error !== 'object' || error === null) return false;
    return 'message' in error && ('status' in error || 'details' in error);
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof DOMException
      ? error.name === 'AbortError'
      : (error as Error).name === 'AbortError';
  }

  private async handleResponse<T>(response: Response, schema?: z.ZodSchema<T>): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        if (errorBody) {
          errorMessage = errorBody;
        }
      }

      const error: APIError = {
        message: errorMessage,
        status: response.status,
        details: errorBody,
      };

      throw error;
    }

    const data = await response.json();

    // Validate if schema provided
    if (schema) {
      try {
        return schema.parse(data);
      } catch (validationError) {
        throw {
          message: 'Invalid response format from server',
          status: 500,
          details: validationError,
        } as APIError;
      }
    }

    return data as T;
  }

  /**
   * Fetch OHLCV (candlestick) data for a given ticker and time period
   * @param ticker - Stock symbol (e.g., 'AAPL', 'GOOGL')
   * @param period - Time period for historical data
   * @param signal - Optional AbortSignal for request cancellation
   * @returns OHLCV data with metadata
   */
  async fetchOHLCV(ticker: string, period: Period, signal?: AbortSignal): Promise<OHLCVResponse> {
    const normalizedTicker = ticker.trim().toUpperCase();
    const url = this.createURL(`/stocks/${encodeURIComponent(normalizedTicker)}/ohlcv`, {
      period,
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal,
      });

      return await this.handleResponse<OHLCVResponse>(response, OHLCVResponseSchema);
    } catch (error) {
      if (this.isAbortError(error)) {
        throw error;
      }

      if (this.isAPIError(error)) {
        throw error;
      }

      throw {
        message: `Failed to fetch OHLCV data for ${normalizedTicker}: ${(error as Error).message}`,
        details: error,
      } as APIError;
    }
  }

  /**
   * Fetch detailed information about a stock
   * @param ticker - Stock symbol (e.g., 'AAPL', 'GOOGL')
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Stock information including price, market cap, sector, etc.
   */
  async fetchStockInfo(ticker: string, signal?: AbortSignal): Promise<StockInfo> {
    const normalizedTicker = ticker.trim().toUpperCase();
    const url = this.createURL(`/stocks/${encodeURIComponent(normalizedTicker)}/info`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal,
      });

      return await this.handleResponse<StockInfo>(response, StockInfoSchema);
    } catch (error) {
      if (this.isAbortError(error)) {
        throw error;
      }

      if (this.isAPIError(error)) {
        throw error;
      }

      throw {
        message: `Failed to fetch stock info for ${normalizedTicker}: ${(error as Error).message}`,
        details: error,
      } as APIError;
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export named functions for convenience
export const fetchOHLCV = (ticker: string, period: Period, signal?: AbortSignal) =>
  apiClient.fetchOHLCV(ticker, period, signal);

export const fetchStockInfo = (ticker: string, signal?: AbortSignal) =>
  apiClient.fetchStockInfo(ticker, signal);

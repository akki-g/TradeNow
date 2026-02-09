/**
 * API Client for trading platform backend
 * Handles all HTTP communication with the FastAPI backend
 * Includes runtime type validation and request cancellation support
 */

import { z } from 'zod';
import type { OHLCVResponse, StockInfo, Period, APIError, SearchResult } from '../types/stock';
import { OHLCVResponseSchema, StockInfoSchema, SearchResultsSchema } from '../types/stock';
import type { DatabaseOverview, DatabaseTableRowsResponse } from '../types/database';
import { DatabaseOverviewSchema, DatabaseTableRowsSchema } from '../types/database';
import { IndicatorSummarySchema } from '../types/indicator';
import type { IndicatorSummary } from '../types/indicator';
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
  /**
 * search stock by ticker or company name
 * @param query 
 * @param limit
 * @param signal - optional AbortSignal for request cancel
 * @returns array of matching stocks
 */
  async searchStocks(query: string, limit: number = 10, signal?: AbortSignal): Promise<SearchResult[]> {
    if (! query || query.trim().length === 0){
      return [];
    }

    const url = this.createURL('/stocks/search', {
      q: query.trim(),
      limit: limit.toString(),
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal,
      });

      return await this.handleResponse<SearchResult[]>(response, SearchResultsSchema);
    } catch (error) {
      if (this.isAbortError(error)){
        throw error;
      }
      if (this.isAPIError(error)){
        throw error;
      }

      throw {
        message: 'Failed to search stocks for "${query}": ${(error as Error).message}',
        details: error,
      } as APIError;
    }
    
  }

  /**
   * Fetch database schema metadata, row counts, and sample records.
   */
  async fetchDatabaseOverview(sampleLimit: number = 5, signal?: AbortSignal): Promise<DatabaseOverview> {
    const url = this.createURL('/database/overview', {
      sample_limit: sampleLimit.toString(),
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal,
      });

      return await this.handleResponse<DatabaseOverview>(response, DatabaseOverviewSchema);
    } catch (error) {
      if (this.isAbortError(error)) {
        throw error;
      }

      if (this.isAPIError(error)) {
        throw error;
      }

      throw {
        message: `Failed to fetch database overview: ${(error as Error).message}`,
        details: error,
      } as APIError;
    }
  }

  /**
   * Fetch paginated rows for a table in the database explorer.
   */
  async fetchDatabaseTableRows(
    tableName: string,
    limit: number = 50,
    offset: number = 0,
    signal?: AbortSignal
  ): Promise<DatabaseTableRowsResponse> {
    const url = this.createURL(`/database/tables/${encodeURIComponent(tableName)}/rows`, {
      limit: limit.toString(),
      offset: offset.toString(),
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal,
      });

      return await this.handleResponse<DatabaseTableRowsResponse>(response, DatabaseTableRowsSchema);
    } catch (error) {
      if (this.isAbortError(error)) {
        throw error;
      }

      if (this.isAPIError(error)) {
        throw error;
      }

      throw {
        message: `Failed to fetch rows for table ${tableName}: ${(error as Error).message}`,
        details: error,
      } as APIError;
    }
  }

  async fetchIndicators(): Promise<IndicatorSummary> {
    const url = this.createURL('/indicators/');
    try {
      const response = await fetch(url, {
        method: 'GET'
      })
      return await this.handleResponse<IndicatorSummary>(response, IndicatorSummarySchema);
    }
    catch (error) {
      if (this.isAbortError(error)){
        throw error;
      }
      if (this.isAPIError(error)){
        throw error;
      }

      throw {
        message: 'Failed to fetch available indicators',
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

export const searchStocks = (query: string, limit?: number, signal?: AbortSignal) =>
  apiClient.searchStocks(query, limit, signal);

export const fetchDatabaseOverview = (sampleLimit?: number, signal?: AbortSignal) =>
  apiClient.fetchDatabaseOverview(sampleLimit, signal);

export const fetchDatabaseTableRows = (
  tableName: string,
  limit?: number,
  offset?: number,
  signal?: AbortSignal
) => apiClient.fetchDatabaseTableRows(tableName, limit, offset, signal);

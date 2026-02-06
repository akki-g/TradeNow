/**
 * Core data types for stock market data
 * Aligned with backend API schemas
 * Uses Zod for runtime type validation
 */

import { z } from 'zod';

// Zod schemas for runtime validation
export const OHLCVPointSchema = z.object({
  time: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

export const OHLCVMetadataSchema = z.object({
  records: z.number(),
  start_date: z.string(),
  end_date: z.string(),
});

export const OHLCVResponseSchema = z.object({
  ticker: z.string(),
  period: z.string(),
  data: z.array(OHLCVPointSchema),
  metadata: OHLCVMetadataSchema,
});

export const StockInfoSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  exchange: z.string().optional(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  market_cap: z.number().optional(),
  current_price: z.number().optional(),
  change: z.number().optional(),
  change_percent: z.number().optional(),
});

// Derive TypeScript types from schemas
export type OHLCVPoint = z.infer<typeof OHLCVPointSchema>;
export type OHLCVMetadata = z.infer<typeof OHLCVMetadataSchema>;
export type OHLCVResponse = z.infer<typeof OHLCVResponseSchema>;
export type StockInfo = z.infer<typeof StockInfoSchema>;

export type Period = '1d' | '5d' | '1mo' | '3mo' | '6mo' | 'ytd' | '1y' | '2y' | '5y' | '10y' | 'max';

export interface APIError {
  message: string;
  status?: number;
  details?: unknown;
}


// search res schemas for stock search

export const SearchResultSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  exchange: z.string().optional(),
  sector: z.string().optional()
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

// array of search res schema

export const SearchResultsSchema = z.array(SearchResultSchema);

export interface RecentlyViewedStock {
  ticker: string;
  name: string;
  viewedAt: number;
}

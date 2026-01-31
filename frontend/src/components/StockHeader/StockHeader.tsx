import React from 'react';

/**
 * Props for the StockHeader component
 */
export interface StockHeaderProps {
  /**
   * Stock ticker symbol to display (e.g., "AAPL", "MSFT", "TSLA")
   */
  ticker: string;
}

/**
 * Stock header component that displays ticker symbol prominently
 *
 * Professional trading terminal style header with:
 * - Large, bold ticker symbol
 * - Left-aligned layout matching institutional trading platforms
 * - Minimal design ready for enhancement in future iterations
 *
 * @example
 * ```tsx
 * <StockHeader ticker="AAPL" />
 * ```
 */
export const StockHeader: React.FC<StockHeaderProps> = ({ ticker }) => {
  return (
    <header className="px-6 py-4 border-b border-trading-border">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-mono text-trading-text tracking-tight">
          {ticker.toUpperCase()}
        </h1>
      </div>
    </header>
  );
};

export default StockHeader;

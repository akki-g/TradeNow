import type { StockInfo } from "../../types/stock";


export interface StockHeaderProps {
  info: StockInfo | null;
  loading?: boolean;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ info, loading }) => {
  // Format large numbers (market cap)
  const formatMarketCap = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  // Format price change
  const formatChange = (change: number, changePercent: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}$${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  // Determine color based on change
  const changeColor = (change?: number): string => {
    if (!change) return 'text-trading-text-secondary';
    return change >= 0 ? 'text-trading-green' : 'text-trading-red';
  };

  if (loading) {
    return (
      <header className="px-6 py-4 border-b border-trading-border">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-trading-panel animate-pulse rounded" />
            <div className="h-4 w-48 bg-trading-panel animate-pulse rounded" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-8 w-32 bg-trading-panel animate-pulse rounded ml-auto" />
            <div className="h-4 w-24 bg-trading-panel animate-pulse rounded ml-auto" />
          </div>
        </div>
      </header>
    );
  }

  if (!info) {
    return (
      <header className="px-6 py-4 border-b border-trading-border">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold font-mono text-trading-text tracking-tight">
            Select a stock
          </h1>
        </div>
      </header>
    );
  }

  return (
    <header className="px-6 py-4 border-b border-trading-border">
      <div className="flex items-center justify-between">
        {/* Left: Ticker and Name */}
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl font-bold font-mono text-trading-text tracking-tight">
            {info.ticker}
          </h1>
          <span className="text-sm text-trading-text-secondary">
            {info.name}
          </span>
          {info.exchange && (
            <span className="text-xs text-trading-text-muted font-mono">
              {info.exchange}
            </span>
          )}
        </div>

        {/* Right: Price and Change */}
        <div className="flex items-baseline gap-6">
          <div className="text-right">
            {info.current_price !== undefined && (
              <div className="font-mono text-2xl font-semibold text-trading-text">
                ${info.current_price.toFixed(2)}
              </div>
            )}
            {info.change !== undefined && info.change_percent !== undefined && (
              <div className={`font-mono text-sm ${changeColor(info.change)}`}>
                {formatChange(info.change, info.change_percent)}
              </div>
            )}
          </div>

          {/* Market Cap */}
          {info.market_cap && (
            <div className="text-right">
              <div className="text-xs text-trading-text-muted">Market Cap</div>
              <div className="font-mono text-sm text-trading-text-secondary">
                {formatMarketCap(info.market_cap)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sector/Industry (if available) */}
      {(info.sector || info.industry) && (
        <div className="mt-2 flex gap-3 text-xs text-trading-text-muted">
          {info.sector && <span>{info.sector}</span>}
          {info.industry && <span>• {info.industry}</span>}
        </div>
      )}
    </header>
  );
};

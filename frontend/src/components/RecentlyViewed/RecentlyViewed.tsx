import type { RecentlyViewedStock } from "../../types/stock";
interface RecentlyViewedProps {
  recentStocks: RecentlyViewedStock[];
  onSelectStock: (ticker: string) => void;
  onClear?: () => void;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
  recentStocks,
  onSelectStock,
  onClear,
}) => {
  if (recentStocks.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-3 border-b border-trading-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-trading-text-secondary uppercase tracking-wide">
          Recently Viewed
        </h3>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-trading-text-muted hover:text-trading-text"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {recentStocks.map((stock) => (
          <button
            key={stock.ticker}
            onClick={() => onSelectStock(stock.ticker)}
            className="
              px-3 py-1 rounded
              bg-trading-panel border border-trading-border
              hover:border-[#3b82f6] hover:bg-trading-bg
              transition-colors
              text-xs font-mono font-semibold text-trading-text
            "
          >
            {stock.ticker}
          </button>
        ))}
      </div>
    </div>
  );
};


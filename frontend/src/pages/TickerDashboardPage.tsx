import { useCallback, useState } from 'react';
import { DashboardLayout } from '../components/Layout';
import { StockHeader } from '../components/StockHeader';
import { StockSearch } from '../components/StockSearch/StockSearch';
import { RecentlyViewed } from '../components/RecentlyViewed/RecentlyViewed';
import { CandlestickChart } from '../components/Chart';
import { TimeframeSelector } from '../components/TimeframeSelector';
import { useStockData } from '../hooks/useStockData';
import { useStockInfo } from '../hooks/useStockInfo';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import type { Period } from '../types/stock';

interface TickerDashboardPageProps {
  onOpenDatabaseExplorer: () => void;
}

export function TickerDashboardPage({ onOpenDatabaseExplorer }: TickerDashboardPageProps) {
  const [ticker, setTicker] = useState('AAPL');
  const [period, setPeriod] = useState<Period>('1y');

  const { data, loading: chartLoading, error: chartError } = useStockData(ticker, period);
  const { info, loading: infoLoading } = useStockInfo(ticker);
  const { recentStocks, addRecentStock, clearRecent } = useRecentlyViewed();

  const handleSelectStock = useCallback((newTicker: string, name?: string) => {
    setTicker(newTicker);
    if (name) {
      addRecentStock(newTicker, name);
    }
  }, [addRecentStock]);

  return (
    <DashboardLayout
      header={
        <div>
          <div className="flex items-center justify-between px-6 py-3 border-b border-trading-border bg-trading-panel">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-trading-text-muted">Ticker Dashboard</div>
              <div className="text-xs text-trading-text-secondary">Live charting and stock search</div>
            </div>
            <button
              type="button"
              onClick={onOpenDatabaseExplorer}
              className="px-4 py-2 text-sm font-medium rounded-md border border-trading-border-strong bg-trading-surface hover:bg-trading-hover text-trading-text transition-trading"
            >
              Database Explorer
            </button>
          </div>

          <div className="flex items-center gap-4 px-6 py-4 border-b border-trading-border">
            <StockSearch
              onSelectStock={handleSelectStock}
              className="flex-1 max-w-md"
            />
          </div>

          <RecentlyViewed
            recentStocks={recentStocks}
            onSelectStock={(selectedTicker) => handleSelectStock(selectedTicker)}
            onClear={clearRecent}
          />

          <StockHeader info={info} loading={infoLoading} />

          <div className="px-6 py-3 border-b border-trading-border">
            <TimeframeSelector selected={period} onChange={setPeriod} />
          </div>
        </div>
      }
    >
      <CandlestickChart data={data} loading={chartLoading} error={chartError} />
    </DashboardLayout>
  );
}

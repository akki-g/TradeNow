import { Suspense, lazy, useState } from 'react';
import { DashboardLayout } from './components/Layout';
import { StockHeader } from './components/StockHeader';
import { TimeframeSelector } from './components/TimeframeSelector';
import { useStockData } from './hooks/useStockData';
import type { Period } from './types/stock';

const CandlestickChart = lazy(async () => {
  const module = await import('./components/Chart/CandlestickChart');
  return { default: module.CandlestickChart };
});

/**
 * Main trading dashboard application
 *
 * Demonstrates integration of:
 * - DashboardLayout (container)
 * - StockHeader (ticker display)
 * - TimeframeSelector (period controls)
 * - CandlestickChart (price + volume visualization)
 * - useStockData hook (data fetching)
 */
function App() {
  const [ticker] = useState('AAPL');
  const [period, setPeriod] = useState<Period>('1y');

  // Fetch stock data based on selected ticker and period
  const { data, loading, error } = useStockData(ticker, period);

  return (
    <DashboardLayout
      header={
        <div>
          <StockHeader ticker={ticker} />
          <TimeframeSelector selected={period} onChange={setPeriod} />
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-[#0f0f0f]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3b82f6] border-t-transparent" />
              <p className="font-mono text-sm text-[#64748b]">Loading chart engine...</p>
            </div>
          </div>
        }
      >
        <CandlestickChart data={data} loading={loading} error={error} />
      </Suspense>
    </DashboardLayout>
  );
}

export default App;

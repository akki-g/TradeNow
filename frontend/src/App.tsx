import { useState } from 'react';
import { DashboardLayout } from './components/Layout';
import { StockHeader } from './components/StockHeader';
import { TimeframeSelector } from './components/TimeframeSelector';
import { CandlestickChart } from './components/Chart';
import { useStockData } from './hooks/useStockData';
import type { Period } from './types/stock';

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
      <CandlestickChart data={data} loading={loading} error={error} />
    </DashboardLayout>
  );
}

export default App;

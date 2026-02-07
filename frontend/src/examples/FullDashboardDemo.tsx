/**
 * Full Dashboard Integration Demo
 * Demonstrates all Iteration 1 components working together
 *
 * This is a complete working example of:
 * - DashboardLayout (container)
 * - StockHeader (ticker display)
 * - TimeframeSelector (period switcher)
 * - CandlestickChart (price + volume chart)
 * - useStockData hook (data fetching)
 */

import { useState } from 'react';
import { DashboardLayout } from '../components/Layout';
import { StockHeader } from '../components/StockHeader';
import { TimeframeSelector } from '../components/TimeframeSelector';
import { CandlestickChart } from '../components/Chart';
import { useStockData } from '../hooks/useStockData';
import { useStockInfo } from '../hooks/useStockInfo';
import type { Period } from '../types/stock';

export function FullDashboardDemo() {
  const [ticker] = useState('AAPL'); // Hardcoded for demo, can be made dynamic
  const [period, setPeriod] = useState<Period>('1y');

  // Fetch stock data using the hook
  const { data, loading, error } = useStockData(ticker, period);
  const { info, loading: infoLoading } = useStockInfo(ticker);

  return (
    <DashboardLayout
      header={
        <div className="space-y-3">
          <StockHeader info={info} loading={infoLoading} />
          <TimeframeSelector selected={period} onChange={setPeriod} />
        </div>
      }
    >
      <CandlestickChart data={data} loading={loading} error={error} />
    </DashboardLayout>
  );
}

/**
 * Example component demonstrating useStockData hook
 * This can be imported into App.tsx to test the data layer
 */

import { useState } from 'react';
import { useStockData } from '../hooks/useStockData';
import type { Period } from '../types/stock';

export function StockDataExample() {
  const [ticker, setTicker] = useState<string>('AAPL');
  const [period, setPeriod] = useState<Period>('1mo');

  const { data, loading, error, refetch } = useStockData(ticker, period);

  const periods: Period[] = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'];

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Stock Data Hook Example</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Ticker:{' '}
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL"
            style={{ padding: '0.5rem', marginLeft: '0.5rem' }}
          />
        </label>

        <label style={{ marginLeft: '1rem' }}>
          Period:{' '}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            style={{ padding: '0.5rem', marginLeft: '0.5rem' }}
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => refetch()}
          style={{ padding: '0.5rem 1rem', marginLeft: '1rem', cursor: 'pointer' }}
        >
          Refetch
        </button>
      </div>

      {loading && (
        <div style={{ padding: '1rem', background: '#333', color: '#fff' }}>
          Loading {ticker} data for period {period}...
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', background: '#ef4444', color: '#fff' }}>
          <strong>Error:</strong> {error.message}
          {error.status && <div style={{ fontSize: '0.875rem' }}>Status: {error.status}</div>}
        </div>
      )}

      {data && !loading && (
        <div style={{ marginTop: '1rem' }}>
          <h2>{data.ticker} - {data.period}</h2>

          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5' }}>
            <h3>Metadata</h3>
            <ul>
              <li>Records: {data.metadata.records}</li>
              <li>Start Date: {data.metadata.start_date}</li>
              <li>End Date: {data.metadata.end_date}</li>
            </ul>
          </div>

          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            <h3>OHLCV Data (First 10 records)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#333', color: '#fff' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Open</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>High</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Low</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Close</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Volume</th>
                </tr>
              </thead>
              <tbody>
                {data.data.slice(0, 10).map((point, idx) => (
                  <tr
                    key={point.time}
                    style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}
                  >
                    <td style={{ padding: '0.5rem' }}>
                      {new Date(point.time).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      {point.open.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      {point.high.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      {point.low.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      {point.close.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      {point.volume.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { DashboardLayout } from '../components/Layout';

/**
 * Demo component showing DashboardLayout usage
 *
 * This demonstrates:
 * - Header slot with stock ticker placeholder
 * - Main content area with chart placeholder
 * - Professional dark theme styling
 * - Proper spacing and typography
 */
export const DashboardLayoutDemo: React.FC = () => {
  return (
    <DashboardLayout
      header={
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Stock ticker section */}
            <div className="flex items-baseline gap-4">
              <h1 className="text-2xl font-semibold text-trading-text">AAPL</h1>
              <span className="text-sm text-trading-text-secondary">Apple Inc.</span>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-6">
              <div className="text-right">
                <div className="font-numeric text-2xl font-semibold text-trading-text">
                  $185.42
                </div>
                <div className="font-numeric text-sm text-trading-green">
                  +2.34 (+1.28%)
                </div>
              </div>
              <div className="text-sm text-trading-text-muted">
                As of 4:00 PM EST
              </div>
            </div>
          </div>
        </div>
      }
    >
      {/* Main chart area placeholder */}
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-trading-text-secondary text-lg">
            Chart Component Will Render Here
          </div>
          <div className="font-numeric text-trading-text-muted text-sm">
            OHLCV Candlestick Data Visualization
          </div>

          {/* Demo grid to show the aesthetic */}
          <div className="mt-8 inline-block bg-trading-panel border border-trading-border rounded px-8 py-6">
            <div className="space-y-3">
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-trading-text-secondary">Open:</span>
                <span className="font-numeric text-trading-text">$183.15</span>
              </div>
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-trading-text-secondary">High:</span>
                <span className="font-numeric text-trading-text">$186.20</span>
              </div>
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-trading-text-secondary">Low:</span>
                <span className="font-numeric text-trading-text">$182.90</span>
              </div>
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-trading-text-secondary">Close:</span>
                <span className="font-numeric text-trading-text">$185.42</span>
              </div>
              <div className="border-t border-trading-border pt-3 flex justify-between gap-8 text-sm">
                <span className="text-trading-text-secondary">Volume:</span>
                <span className="font-numeric text-trading-text">52.4M</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardLayoutDemo;

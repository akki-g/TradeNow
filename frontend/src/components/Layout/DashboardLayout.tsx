import React from 'react';

/**
 * Props for the DashboardLayout component
 */
export interface DashboardLayoutProps {
  /**
   * Main content area - typically the chart and related components
   */
  children: React.ReactNode;

  /**
   * Header slot - for stock ticker, price info, and controls
   */
  header?: React.ReactNode;
}

/**
 * Main layout container for the trading dashboard
 *
 * Provides a professional, institutional-grade dark theme layout with:
 * - Full viewport height container
 * - Header area for stock information and controls
 * - Main content area for charts and data visualization
 * - Proper spacing and borders matching financial terminal aesthetics
 *
 * @example
 * ```tsx
 * <DashboardLayout
 *   header={<StockHeader ticker="AAPL" />}
 * >
 *   <CandlestickChart data={ohlcvData} />
 * </DashboardLayout>
 * ```
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, header }) => {
  return (
    <div className="h-screen w-screen bg-trading-bg flex flex-col overflow-hidden">
      {/* Header Area */}
      {header && (
        <header className="flex-shrink-0 bg-trading-panel border-b border-trading-border">
          {header}
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-trading-bg">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

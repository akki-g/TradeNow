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
 * CRITICAL CSS NOTES:
 * - The main element uses `min-h-0` which is essential for flex children
 *   to properly calculate percentage-based heights
 * - Without `min-h-0`, flex items have implicit `min-height: auto` which
 *   prevents them from shrinking below content size, breaking height calculations
 * - The main element also uses `relative` positioning so absolute children
 *   can properly size themselves
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

      {/* 
        Main Content Area
        CRITICAL: min-h-0 allows flex item to shrink below content size
        This is essential for chart components that need percentage heights
        The 'relative' class establishes positioning context for absolute children
      */}
      <main className="flex-1 min-h-0 relative overflow-hidden bg-trading-bg">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
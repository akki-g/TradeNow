/**
 * Professional Candlestick Chart with Volume Histogram
 * Built for institutional-grade trading platforms
 * Uses TradingView's lightweight-charts library v5
 * 
 * FIXED VERSION - Addresses:
 * 1. Chart dimensions must be explicitly set at creation
 * 2. Volume series must use a separate price scale properly
 * 3. Container must have explicit height for ResizeObserver to work
 */

import { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';
import {
  createChart,
  CrosshairMode,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  UTCTimestamp,
} from 'lightweight-charts';
import type { OHLCVResponse, APIError } from '../../types/stock';

interface CandlestickChartProps {
  data: OHLCVResponse | null;
  loading?: boolean;
  error?: APIError | null;
}

/**
 * Convert ISO 8601 timestamp to Unix timestamp (seconds)
 * lightweight-charts requires Unix timestamps in seconds
 */
const convertToUnixTime = (isoTime: string): UTCTimestamp => {
  return Math.floor(new Date(isoTime).getTime() / 1000) as UTCTimestamp;
};

/**
 * Convert backend OHLCV data to lightweight-charts candlestick format
 */
const convertToCandlestickData = (data: OHLCVResponse): CandlestickData[] => {
  return data.data.map((point) => ({
    time: convertToUnixTime(point.time),
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
  }));
};

/**
 * Convert backend OHLCV data to volume histogram with directional coloring
 * Green for up days (close >= previous close), Red for down days
 */
const convertToVolumeData = (data: OHLCVResponse): HistogramData[] => {
  return data.data.map((point, index) => {
    const prevClose = index > 0 ? data.data[index - 1].close : point.open;
    const isUp = point.close >= prevClose;

    return {
      time: convertToUnixTime(point.time),
      value: point.volume,
      color: isUp ? '#22c55e' : '#ef4444',
    };
  });
};

function CandlestickChartComponent({ data, loading, error }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  // Memoize data conversion to avoid unnecessary recalculations
  const candlestickData = useMemo(() => {
    if (!data || data.data.length === 0) return [];
    return convertToCandlestickData(data);
  }, [data]);

  const volumeData = useMemo(() => {
    if (!data || data.data.length === 0) return [];
    return convertToVolumeData(data);
  }, [data]);

  // Resize handler - defined outside useEffect so it can be reused
  const handleResize = useCallback(() => {
    if (!chartContainerRef.current || !chartRef.current) return;
    
    const { width, height } = chartContainerRef.current.getBoundingClientRect();
    console.log('[CandlestickChart] Resize detected:', { width, height });
    
    // Only resize if we have valid dimensions
    if (width > 0 && height > 0) {
      chartRef.current.applyOptions({
        width: Math.floor(width),
        height: Math.floor(height),
      });
    }
  }, []);

  // Initialize chart on mount
  useEffect(() => {
    console.log('[CandlestickChart] Initializing chart');

    if (!chartContainerRef.current) {
      console.error('[CandlestickChart] Chart container ref is null');
      return;
    }

    // CRITICAL: Get dimensions BEFORE creating chart
    // Use fallback dimensions if container not yet sized
    const rect = chartContainerRef.current.getBoundingClientRect();
    const initialWidth = rect.width > 0 ? Math.floor(rect.width) : 800;
    const initialHeight = rect.height > 0 ? Math.floor(rect.height) : 500;
    
    console.log('[CandlestickChart] Creating chart with dimensions:', { initialWidth, initialHeight });

    // Create chart with EXPLICIT dimensions - this is critical!
    const chart = createChart(chartContainerRef.current, {
      width: initialWidth,
      height: initialHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#0f0f0f' },
        textColor: '#a3a3a3',
        fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
      },
      grid: {
        vertLines: { color: '#262626', style: 1, visible: true },
        horzLines: { color: '#262626', style: 1, visible: true },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#3b82f6',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b',
        },
      },
      timeScale: {
        borderColor: '#262626',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 8,
        minBarSpacing: 4,
      },
      rightPriceScale: {
        borderColor: '#262626',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2, // Leave room for volume at bottom
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    console.log('[CandlestickChart] Chart instance created');

    // Add candlestick series FIRST (v5 API)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    console.log('[CandlestickChart] Candlestick series added');

    // Add volume histogram series on a SEPARATE price scale (v5 API)
    // Using 'volume' as the priceScaleId to create a dedicated scale
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume', // Use a named scale instead of empty string
    });

    // Configure the volume price scale to occupy bottom 20% of chart
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    console.log('[CandlestickChart] Volume series added');

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Set up ResizeObserver for responsive sizing
    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to avoid layout thrashing
      window.requestAnimationFrame(() => {
        if (!entries || !entries.length) return;
        handleResize();
      });
    });

    resizeObserver.observe(chartContainerRef.current);

    // Mark chart as ready AFTER a small delay to ensure DOM is settled
    // This helps with the initial resize
    const readyTimeout = setTimeout(() => {
      handleResize(); // Force initial resize
      setIsChartReady(true);
      console.log('[CandlestickChart] Chart ready');
    }, 100);

    // Cleanup on unmount
    return () => {
      console.log('[CandlestickChart] Cleaning up');
      clearTimeout(readyTimeout);
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      setIsChartReady(false);
    };
  }, [handleResize]);

  // Update chart data when data prop changes
  useEffect(() => {
    console.log('[CandlestickChart] Data update check:', {
      isChartReady,
      candlestickDataLength: candlestickData.length,
      volumeDataLength: volumeData.length,
      hasCandlestickSeries: !!candlestickSeriesRef.current,
      hasVolumeSeries: !!volumeSeriesRef.current,
    });

    if (!isChartReady) {
      console.log('[CandlestickChart] Chart not ready, skipping data update');
      return;
    }

    if (candlestickData.length === 0) {
      console.log('[CandlestickChart] No data to display');
      return;
    }

    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) {
      console.log('[CandlestickChart] Series refs not available');
      return;
    }

    try {
      console.log('[CandlestickChart] Setting data:', {
        candlesticks: candlestickData.length,
        volumes: volumeData.length,
        firstCandle: candlestickData[0],
        lastCandle: candlestickData[candlestickData.length - 1],
      });

      // Set the data
      candlestickSeriesRef.current.setData(candlestickData);
      volumeSeriesRef.current.setData(volumeData);

      // Fit content to view
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }

      console.log('[CandlestickChart] Data updated successfully');
    } catch (err) {
      console.error('[CandlestickChart] Failed to update chart data:', err);
    }
  }, [candlestickData, volumeData, isChartReady]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748b] font-mono">Loading chart data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-3 max-w-md px-6">
          <div className="w-12 h-12 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[#ef4444]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-[#e2e8f0] mb-1">Failed to load chart</h3>
            <p className="text-xs text-[#64748b] font-mono">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - show when no data and not loading
  if (!data || data.data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[#64748b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-sm text-[#64748b] font-mono">No chart data available</p>
        </div>
      </div>
    );
  }

  // Chart view
  // CRITICAL: The container needs a fixed height or use absolute positioning
  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        backgroundColor: '#0f0f0f',
      }}
    >
      <div 
        ref={chartContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export const CandlestickChart = memo(CandlestickChartComponent);
/**
 * Professional Candlestick Chart with Volume Histogram
 * Built for institutional-grade trading platforms
 * Uses TradingView's lightweight-charts library
 */

import { useEffect, useRef, useState } from 'react';
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

export function CandlestickChart({ data, loading, error }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  // Initialize chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
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
          bottom: 0.25, // Leave room for volume
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

    // Add candlestick series (v5 API)
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

    // Add volume histogram series (v5 API)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Separate scale for volume
    });

    // Position volume in bottom 20% of chart
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    setIsChartReady(true);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect();
        chartRef.current.applyOptions({
          width: Math.floor(width),
          height: Math.floor(height),
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      setIsChartReady(false);
    };
  }, []);

  // Update chart data when data prop changes
  useEffect(() => {
    if (!isChartReady || !data || !candlestickSeriesRef.current || !volumeSeriesRef.current) {
      return;
    }

    try {
      const candlestickData = convertToCandlestickData(data);
      const volumeData = convertToVolumeData(data);

      candlestickSeriesRef.current.setData(candlestickData);
      volumeSeriesRef.current.setData(volumeData);

      // Fit content to view
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (err) {
      console.error('Failed to update chart data:', err);
    }
  }, [data, isChartReady]);

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

  // Empty state
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
  return (
    <div className="w-full h-full relative bg-[#0f0f0f]">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}

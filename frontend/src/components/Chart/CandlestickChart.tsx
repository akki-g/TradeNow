/**
 * Candlestick + volume chart built on Apache ECharts.
 *
 * Why ECharts:
 * - Rich configuration surface for future overlays/indicators/annotations.
 * - Mature interaction model (linked crosshair, zoom controls, tooltips).
 * - Strong TypeScript support and canvas rendering performance.
 */

import { memo, useEffect, useMemo, useRef } from 'react';
import { use as registerEChartsModules, init, type ComposeOption, type EChartsType } from 'echarts/core';
import {
  BarChart,
  CandlestickChart as EChartsCandlestickChart,
  type BarSeriesOption,
  type CandlestickSeriesOption,
} from 'echarts/charts';
import {
  AxisPointerComponent,
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
  type AxisPointerComponentOption,
  type DataZoomComponentOption,
  type GridComponentOption,
  type TooltipComponentOption,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { APIError, OHLCVResponse } from '../../types/stock';

registerEChartsModules([
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  AxisPointerComponent,
  EChartsCandlestickChart,
  BarChart,
  CanvasRenderer,
]);

interface CandlestickChartProps {
  data: OHLCVResponse | null;
  loading?: boolean;
  error?: APIError | null;
}

interface NormalizedChartPoint {
  isoTime: string;
  timestampMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volumeColor: string;
}

interface VolumeDatum {
  value: number;
  itemStyle: {
    color: string;
  };
}

interface NormalizedChartData {
  points: NormalizedChartPoint[];
  categories: string[];
  candles: [number, number, number, number][];
  volumes: VolumeDatum[];
  useIntradayAxisLabels: boolean;
}

type TradingEChartsOption = ComposeOption<
  | GridComponentOption
  | TooltipComponentOption
  | DataZoomComponentOption
  | AxisPointerComponentOption
  | CandlestickSeriesOption
  | BarSeriesOption
>;

const EMPTY_CHART_DATA: NormalizedChartData = {
  points: [],
  categories: [],
  candles: [],
  volumes: [],
  useIntradayAxisLabels: false,
};

const HAS_TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/i;
const UP_COLOR = '#22c55e';
const DOWN_COLOR = '#ef4444';
const GRID_COLOR = '#262626';
const AXIS_TEXT_COLOR = '#94a3b8';
const CHART_BG = '#0f0f0f';
const VOLUME_WINDOW_SIZE = 150;

const AXIS_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
});

const AXIS_INTRADAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const TOOLTIP_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const VOLUME_FORMATTER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

const toEpochMs = (isoTime: string): number | null => {
  const normalizedTime = HAS_TIMEZONE_SUFFIX.test(isoTime) ? isoTime : `${isoTime}Z`;
  const timestampMs = Date.parse(normalizedTime);
  return Number.isFinite(timestampMs) ? timestampMs : null;
};

const formatAxisLabel = (isoTime: string, useIntradayAxisLabels: boolean): string => {
  const date = new Date(isoTime);
  return useIntradayAxisLabels
    ? AXIS_INTRADAY_FORMATTER.format(date)
    : AXIS_DATE_FORMATTER.format(date);
};

const formatTooltipDate = (isoTime: string): string => TOOLTIP_DATE_FORMATTER.format(new Date(isoTime));

const computeZoomStart = (pointCount: number): number => {
  if (pointCount <= VOLUME_WINDOW_SIZE) {
    return 0;
  }

  const visibleRatio = VOLUME_WINDOW_SIZE / pointCount;
  return Math.max(0, Math.round((1 - visibleRatio) * 100));
};

const normalizeChartData = (response: OHLCVResponse | null): NormalizedChartData => {
  if (!response || response.data.length === 0) {
    return EMPTY_CHART_DATA;
  }

  const parsedPoints: Omit<NormalizedChartPoint, 'volumeColor'>[] = [];
  let isAlreadySorted = true;
  let previousTimestamp = Number.NEGATIVE_INFINITY;

  for (const point of response.data) {
    const timestampMs = toEpochMs(point.time);
    if (timestampMs === null) {
      continue;
    }

    if (timestampMs < previousTimestamp) {
      isAlreadySorted = false;
    }

    parsedPoints.push({
      isoTime: point.time,
      timestampMs,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
    });

    previousTimestamp = timestampMs;
  }

  const sortedPoints = isAlreadySorted
    ? parsedPoints
    : [...parsedPoints].sort((left, right) => left.timestampMs - right.timestampMs);

  if (sortedPoints.length === 0) {
    return EMPTY_CHART_DATA;
  }

  let previousClose: number | null = null;
  const points: NormalizedChartPoint[] = [];
  const categories: string[] = [];
  const candles: [number, number, number, number][] = [];
  const volumes: VolumeDatum[] = [];

  for (const point of sortedPoints) {
    const referenceClose = previousClose ?? point.open;
    const volumeColor = point.close >= referenceClose ? UP_COLOR : DOWN_COLOR;

    points.push({
      ...point,
      volumeColor,
    });

    categories.push(point.isoTime);
    candles.push([point.open, point.close, point.low, point.high]);
    volumes.push({
      value: point.volume,
      itemStyle: { color: volumeColor },
    });

    previousClose = point.close;
  }

  const firstPointTime = points[0]?.timestampMs ?? 0;
  const lastPointTime = points[points.length - 1]?.timestampMs ?? 0;
  const timeRangeMs = lastPointTime - firstPointTime;
  const useIntradayAxisLabels = timeRangeMs <= 7 * 24 * 60 * 60 * 1000;

  return {
    points,
    categories,
    candles,
    volumes,
    useIntradayAxisLabels,
  };
};

const buildChartOption = (chartData: NormalizedChartData): TradingEChartsOption => {
  const hasData = chartData.points.length > 0;
  const zoomStart = computeZoomStart(chartData.points.length);

  const tooltipFormatter: NonNullable<TooltipComponentOption['formatter']> = (params: unknown) => {
    const normalizedParams = Array.isArray(params) ? params : [params];

    const firstDataIndex = normalizedParams
      .map((entry) => {
        if (typeof entry !== 'object' || entry === null || !('dataIndex' in entry)) {
          return null;
        }

        const dataIndex = (entry as { dataIndex?: unknown }).dataIndex;
        return typeof dataIndex === 'number' ? dataIndex : null;
      })
      .find((dataIndex): dataIndex is number => dataIndex !== null);

    if (firstDataIndex === undefined) {
      return '';
    }

    const point = chartData.points[firstDataIndex];
    if (!point) {
      return '';
    }

    return [
      `<div style="font-family:'JetBrains Mono','Roboto Mono',monospace;">`,
      `<div style="margin-bottom:6px;color:#e2e8f0;">${formatTooltipDate(point.isoTime)}</div>`,
      `<div style="color:${UP_COLOR};">Open: ${PRICE_FORMATTER.format(point.open)}</div>`,
      `<div style="color:#38bdf8;">High: ${PRICE_FORMATTER.format(point.high)}</div>`,
      `<div style="color:#f97316;">Low: ${PRICE_FORMATTER.format(point.low)}</div>`,
      `<div style="color:${DOWN_COLOR};">Close: ${PRICE_FORMATTER.format(point.close)}</div>`,
      `<div style="margin-top:6px;color:${point.volumeColor};">Vol: ${VOLUME_FORMATTER.format(point.volume)}</div>`,
      `</div>`,
    ].join('');
  };

  return {
    animation: false,
    backgroundColor: CHART_BG,
    axisPointer: {
      link: [{ xAxisIndex: [0, 1] }],
      label: {
        backgroundColor: '#1e293b',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      borderColor: '#334155',
      borderWidth: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      textStyle: {
        color: '#e2e8f0',
        fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
        fontSize: 12,
      },
      formatter: tooltipFormatter,
    },
    grid: [
      {
        left: 56,
        right: 56,
        top: 20,
        height: '65%',
      },
      {
        left: 56,
        right: 56,
        top: '76%',
        height: '14%',
      },
    ],
    xAxis: [
      {
        type: 'category',
        data: chartData.categories,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: GRID_COLOR,
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: AXIS_TEXT_COLOR,
          fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
          formatter: (value: string) => formatAxisLabel(value, chartData.useIntradayAxisLabels),
        },
        min: 'dataMin',
        max: 'dataMax',
      },
      {
        type: 'category',
        gridIndex: 1,
        data: chartData.categories,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: GRID_COLOR,
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        min: 'dataMin',
        max: 'dataMax',
      },
    ],
    yAxis: [
      {
        scale: true,
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: GRID_COLOR,
          },
        },
        splitLine: {
          lineStyle: {
            color: GRID_COLOR,
          },
        },
        axisLabel: {
          color: AXIS_TEXT_COLOR,
          fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
          formatter: (value: number) => PRICE_FORMATTER.format(value),
        },
      },
      {
        scale: true,
        gridIndex: 1,
        position: 'right',
        splitNumber: 2,
        axisLine: {
          show: true,
          lineStyle: {
            color: GRID_COLOR,
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          color: AXIS_TEXT_COLOR,
          fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
          formatter: (value: number) => VOLUME_FORMATTER.format(value),
        },
      },
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: hasData ? zoomStart : 0,
        end: 100,
        zoomLock: false,
      },
      {
        type: 'slider',
        xAxisIndex: [0, 1],
        bottom: 8,
        height: 20,
        start: hasData ? zoomStart : 0,
        end: 100,
        borderColor: '#334155',
        backgroundColor: '#0f172a',
        fillerColor: 'rgba(59, 130, 246, 0.2)',
        dataBackground: {
          areaStyle: { color: 'rgba(148, 163, 184, 0.2)' },
          lineStyle: { color: '#64748b' },
        },
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#3b82f6',
        },
        textStyle: {
          color: AXIS_TEXT_COLOR,
          fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
        },
      },
    ],
    series: [
      {
        name: 'Price',
        type: 'candlestick',
        data: chartData.candles,
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: {
          color: UP_COLOR,
          color0: DOWN_COLOR,
          borderColor: UP_COLOR,
          borderColor0: DOWN_COLOR,
        },
      },
      {
        name: 'Volume',
        type: 'bar',
        data: chartData.volumes,
        xAxisIndex: 1,
        yAxisIndex: 1,
        barMaxWidth: 12,
      },
    ],
  };
};

function CandlestickChartComponent({ data, loading, error }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);

  const chartData = useMemo(() => normalizeChartData(data), [data]);
  const chartOption = useMemo(() => buildChartOption(chartData), [chartData]);
  const hasData = chartData.points.length > 0;

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    const chart = init(chartContainerRef.current, undefined, {
      renderer: 'canvas',
    });

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      chart.resize({
        animation: {
          duration: 0,
        },
      });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    chartRef.current.setOption(chartOption, {
      notMerge: false,
      lazyUpdate: true,
    });
  }, [chartOption]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: CHART_BG,
      }}
    >
      <div
        ref={chartContainerRef}
        style={{
          position: 'absolute',
          inset: 0,
        }}
      />

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f0f0f]/85">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3b82f6] border-t-transparent" />
            <p className="font-mono text-sm text-[#64748b]">Loading chart data...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f0f0f]/90">
          <div className="flex max-w-md flex-col items-center gap-3 px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ef4444]/10">
              <svg className="h-6 w-6 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="mb-1 text-sm font-medium text-[#e2e8f0]">Failed to load chart</h3>
              <p className="font-mono text-xs text-[#64748b]">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !hasData && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f0f0f]/90">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#262626]">
              <svg className="h-6 w-6 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="font-mono text-sm text-[#64748b]">No chart data available</p>
          </div>
        </div>
      )}
    </div>
  );
}

export const CandlestickChart = memo(CandlestickChartComponent);

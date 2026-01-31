import React from 'react';
import type { Period } from '../../types/stock';

/**
 * Props for the TimeframeSelector component
 */
export interface TimeframeSelectorProps {
  /**
   * Currently selected timeframe period
   */
  selected: Period;

  /**
   * Callback when a timeframe is selected
   */
  onChange: (period: Period) => void;
}

/**
 * Timeframe option configuration
 * Maps UI labels to backend Period values
 */
interface TimeframeOption {
  label: string;
  value: Period;
}

/**
 * Available timeframe options for the selector
 * Ordered from shortest to longest period
 */
const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
  { label: 'All', value: 'max' },
];

/**
 * Timeframe selector component for chart period control
 *
 * Institutional-grade button group with:
 * - 7 timeframe options (1M through All)
 * - Active/inactive state with subtle professional styling
 * - Keyboard accessible with proper focus management
 * - Controlled component pattern
 *
 * @example
 * ```tsx
 * const [period, setPeriod] = useState<Period>('1y');
 *
 * <TimeframeSelector
 *   selected={period}
 *   onChange={setPeriod}
 * />
 * ```
 */
export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className="px-6 py-3 border-b border-trading-border">
      <div className="flex items-center gap-1">
        {TIMEFRAME_OPTIONS.map((option) => {
          const isActive = selected === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`
                px-3 py-1.5
                font-mono text-sm
                rounded-sm
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-trading-blue focus:ring-offset-2 focus:ring-offset-trading-bg
                ${
                  isActive
                    ? 'bg-trading-surface text-trading-blue font-semibold'
                    : 'bg-transparent text-trading-text-secondary hover:bg-trading-panel hover:text-trading-text'
                }
              `}
              aria-pressed={isActive}
              aria-label={`Select ${option.label} timeframe`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeframeSelector;

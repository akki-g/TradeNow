import type { SearchResult } from "../../types/stock";

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  onSelect: (result: SearchResult) => void;
  highlightedIndex: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  onSelect,
  highlightedIndex,
}) => {
  if (loading) {
    return (
      <div className="absolute z-50 top-full mt-1 w-full bg-trading-panel border border-trading-border rounded-md shadow-lg">
        <div className="p-4 text-center text-trading-text-secondary text-sm">
          Searching...
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-50 top-full mt-1 w-full bg-trading-panel border border-trading-border rounded-md shadow-lg max-h-96 overflow-y-auto">
      {results.map((result, index) => (
        <button
          key={result.ticker}
          onClick={() => onSelect(result)}
          className={`
            w-full text-left px-4 py-3 border-b border-trading-border last:border-b-0
            hover:bg-trading-bg transition-colors
            ${index === highlightedIndex ? 'bg-trading-bg' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono font-semibold text-trading-text">
                {result.ticker}
              </div>
              <div className="text-sm text-trading-text-secondary">
                {result.name}
              </div>
            </div>
            <div className="text-right text-xs text-trading-text-muted">
              {result.exchange && <div>{result.exchange}</div>}
              {result.sector && <div>{result.sector}</div>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

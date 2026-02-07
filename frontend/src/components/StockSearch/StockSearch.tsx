import { useState, useEffect, useRef } from "react";
import type { SearchResult } from "../../types/stock";
import { SearchResults } from "./SearchResults";
import { useStockSearch } from "../../hooks/useStockSearch";
interface StockSearchProps {
  onSelectStock: (ticker: string, name: string) => void;
  className?: string;
}

export const StockSearch: React.FC<StockSearchProps> = ({ onSelectStock, className = '' }) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { results, loading } = useStockSearch(query);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelectResult(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectStock(result.ticker, result.name);
    setQuery('');
    setShowResults(false);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-trading-text-muted">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search stocks..."
          className="
            w-full pl-10 pr-4 py-2 
            bg-trading-panel border border-trading-border rounded-md
            text-trading-text placeholder-trading-text-muted
            focus:outline-none focus:border-[#3b82f6]
            font-mono text-sm
          "
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowResults(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-trading-text-muted hover:text-trading-text"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && query.length > 0 && (
        <SearchResults
          results={results}
          loading={loading}
          onSelect={handleSelectResult}
          highlightedIndex={highlightedIndex}
        />
      )}
    </div>
  );
};

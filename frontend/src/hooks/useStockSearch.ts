import { useState, useEffect, useRef } from "react";
import { searchStocks } from "../services/api";
import type { SearchResult, APIError} from "../types/stock";



interface UseStockSearchReturn {
    results: SearchResult[];
    loading: boolean;
    error: APIError | null;
}

/**
 * hook for searching stocks with debounced input
 */

export function useStockSearch (
    query: string,
    limit: number = 10,
    debounceMs: number = 300
): UseStockSearchReturn {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<APIError | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (abortControllerRef.current){
            abortControllerRef.current.abort();
        }

        if (!query || query.trim().length === 0){
            setResults([]);
            setLoading(false);
            setError(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            setError(null);

            abortControllerRef.current = new AbortController();
            
            try {
                const searchResults = await searchStocks(
                    query,
                    limit,
                    abortControllerRef.current?.signal
                );
                
                setResults(searchResults);
                setLoading(false);
            }
            catch (err) {
                if ((err as Error).name === 'AbortError'){
                    return;
                }

                setError({
                    message: (err as APIError).message || 'Search failed',
                    status: (err as APIError).status,
                    details: (err as APIError).details
                })

                setResults([]);
                setLoading(false);
            }
        }, debounceMs);

        return () => {
            clearTimeout(timeoutId);
            if (abortControllerRef.current){
                abortControllerRef.current.abort();
            }
        };
    }, [query, limit, debounceMs]);

    return { results, loading, error };
}
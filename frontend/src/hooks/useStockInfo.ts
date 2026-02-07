import { useState, useEffect, useCallback, useRef } from "react";
import { fetchStockInfo } from "../services/api";
import type { APIError, StockInfo } from "../types/stock";


interface UseStockInfoReturn {
    info: StockInfo | null;
    loading: boolean;
    error: APIError | null;
    refetch: () => Promise<void>;
}

/**
 * hook for fetching detailed stock infor
 */

export function useStockInfo(ticker:string): UseStockInfoReturn {
    const [info, setInfo] = useState<StockInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<APIError | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchInfo = useCallback(async () => {
        if (!ticker || ticker.trim().length === 0) {
            setInfo(null);
            setLoading(false);
            setError(null);
            return;
        }

        if (abortControllerRef.current){
            abortControllerRef.current.abort();
        }

        setLoading(true);
        setError(null);
        abortControllerRef.current = new AbortController();

        try {
            const stockInfo = await fetchStockInfo(
                ticker, 
                abortControllerRef.current.signal
            );
            setInfo(stockInfo);
            setLoading(false);
        }
        catch (err) {
            if ((err as Error).name === 'AbortError'){
                return;
            }

            setError({
                message: (err as APIError).message || 'Failed to fetch stock info',
                status: (err as APIError).status,
                details: (err as APIError).details
            });

            setInfo(null);
            setLoading(false);
        }
    }, [ticker]);

    useEffect(() => {
        fetchInfo();

        return () => {
            if (abortControllerRef.current){
                abortControllerRef.current.abort();
            }
        };
    }, [fetchInfo]);

    return { info, loading, error, refetch: fetchInfo};
}
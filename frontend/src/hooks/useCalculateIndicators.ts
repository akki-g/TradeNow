import { useState, useRef, useCallback } from "react";
import { fetchBatchCalculateIndicator } from "../services/api";
import { type BatchCalculateResponse, type BatchIndicatorItem } from "../types/indicator";
import type { APIError } from "../types/stock";


interface UseCalculateResult {
    data: BatchCalculateResponse | null;
    loading: boolean;
    error: APIError | null;
    calculate: (ticker: string, period: string, indicators: BatchIndicatorItem []) => Promise<void>;
}

export function useCalculateIndicators(): UseCalculateResult {
    const [data, setData] = useState<BatchCalculateResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<APIError | null> (null);
    const abortControllerRef = useRef<AbortController | null> (null);

    const fetchCalculateIndicators = useCallback( async (ticker: string, period: string, indicators: BatchIndicatorItem[]) => {

        if (!ticker || ticker.trim().length === 0 || indicators.length === 0){
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setLoading(true);
        setError(null);
        abortControllerRef.current = new AbortController();
        try {
            const indicatorCalculation = await fetchBatchCalculateIndicator( {ticker, period, indicators}, abortControllerRef.current.signal);
            setData(indicatorCalculation);
            setLoading(false);
        }
        catch (error) {
            if ((error as Error).name === 'AbortError'){
                return;
            }

            setError({
                message: (error as APIError).message || `Could not process calculation request for ${encodeURIComponent(ticker)}`,
                status: (error as APIError).status,
                details: (error as APIError).details
            })

            setData(null);
            setLoading(false);
        }

    }, []);

    return {data, loading, error, calculate: fetchCalculateIndicators}
}
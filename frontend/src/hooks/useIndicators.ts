import { useState, useCallback, useRef, useEffect } from "react";
import { fetchIndicators } from "../services/api";
import type { IndicatorSummary } from "../types/indicator";
import type { APIError } from "../types/stock";


interface UseIndicatorResult {
    data: IndicatorSummary[] | null;
    loading: boolean;
    error: APIError | null;
    refetch: () => Promise<void>;
}


export function useIndicators(): UseIndicatorResult {
    const [data, setData] = useState<IndicatorSummary[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<APIError | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchIndicatorsSummary = useCallback(async () => {
        
        if (abortControllerRef.current){
            abortControllerRef.current.abort();
        }

        setLoading(true);
        setError(null);
        abortControllerRef.current = new AbortController();

        try{
            const indicatorSummaries = await fetchIndicators(
                abortControllerRef.current.signal
            );

            setData(indicatorSummaries);
            setLoading(false);
        }
        catch (error) {
            if ((error as Error).name === 'AbortError'){
                return;
            }

            setError({
                message: (error as APIError).message || 'Failed to fetch available indicators',
                status: (error as APIError).status,
                details: (error as APIError).details
            });

            setData(null);
            setLoading(false);
        }

        useEffect(() => {
            fetchIndicatorsSummary();

            return () => {
                if (abortControllerRef.current){
                    abortControllerRef.current.abort();
                }
            };
        }, [fetchIndicatorsSummary])


    }, []);

    return {data, loading, error, refetch: fetchIndicatorsSummary}
}
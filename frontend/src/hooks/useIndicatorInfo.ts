import { useState, useEffect, useRef, useCallback } from "react";
import { fetchIndicatorInfo } from "../services/api";
import type { IndicatorDetail } from "../types/indicator";
import type { APIError } from "../types/stock";

interface UseIndicatorInfoResult {
    data: IndicatorDetail | null;
    loading: boolean;
    error: APIError | null;
    refetch: () => Promise<void>;
}

export function UseIndicatorInfo(indicator_name: string): UseIndicatorInfoResult {
    const [data, setData] = useState<IndicatorDetail | null> (null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<APIError | null> (null);
    const abortControllerRef = useRef<AbortController | null> (null);

    const fetchIndicatorDetails = useCallback( async () => {

        if (!indicator_name || indicator_name.trim().length === 0){
            setData(null);
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
            const indicatorInfo = await fetchIndicatorInfo(indicator_name, abortControllerRef.current.signal);
            setData(indicatorInfo);
            setLoading(false);
        }
        catch (error) {
            if ((error as Error).name === 'AbortError'){
                return;
            }
            setError({
                message: (error as APIError).message || `Failed to fetch indicator ${encodeURIComponent(indicator_name)}'s info`,
                status: (error as APIError).status,
                details: (error as APIError).details
            })

            setData(null);
            setLoading(false);
        }
    }, [indicator_name]);

    useEffect(() => {
        fetchIndicatorDetails();

        return () => {
            if (abortControllerRef.current){
                abortControllerRef.current.abort();
            }
        }
    }, [fetchIndicatorInfo]);

    return {data, loading, error, refetch: fetchIndicatorDetails}
}

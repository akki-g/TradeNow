import {useState, useEffect, useCallback} from 'react';
import type { RecentlyViewedStock,} from '../types/stock';

const RECENTLY_VIEWED_KEY = 'tradingPlatform_recentlyViewed';
const MAX_RECENTLY_VIEWED = 10;

interface UseRecentlyViewedReturn{
    recentStocks: RecentlyViewedStock[];
    addRecentStock: (ticker: string, name: string) => void;
    clearRecent: () => void;
}

export function useRecentlyViewed(): UseRecentlyViewedReturn{
    const [recentStocks, setRecentStocks] = useState<RecentlyViewedStock[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as RecentlyViewedStock[];
                setRecentStocks(parsed);
            }
        }
        catch (err) {
            console.error('Failed to load recently view Stocks', err);
        }
    }, []);

    const addRecentStock = useCallback((ticker: string, name: string) => {
        setRecentStocks((prev) => {
            const filtered = prev.filter((s) => s.ticker !== ticker);

            const updated = [
                {
                    ticker, 
                    name, 
                    viewedAt: Date.now(),
                },
                ...filtered,
            ].slice(0, MAX_RECENTLY_VIEWED);
            try {
                localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
            }
            catch (err) {
                console.error('Failed to save recently viewed stocks: ', err);
            }

            return updated;
        });
    }, []);


    const clearRecent = useCallback(() => {
        setRecentStocks([]);

        try {
            localStorage.removeItem(RECENTLY_VIEWED_KEY);
        } catch (err) {
            console.error('failed to clear recent stocks', err);
        }
    }, []);

    return { recentStocks, addRecentStock, clearRecent, };
}
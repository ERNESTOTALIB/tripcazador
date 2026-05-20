import { useCallback, useEffect, useState } from 'react';
import { getDeals, type GetDealsParams } from '@/lib/api';
import type { Deal } from '@/types/deal';

export interface UseDealsState {
  deals: Deal[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDeals(params: GetDealsParams = { limit: 50 }): UseDealsState {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const res = await getDeals(params);
    if (res.data?.deals) {
      setDeals(res.data.deals);
    } else if (res.error) {
      setError(res.error);
    }
    setLoading(false);
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    void fetcher(false);
  }, [fetcher]);

  return { deals, loading, refreshing, error, refresh: () => fetcher(true) };
}

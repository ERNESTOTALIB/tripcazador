import { useCallback, useEffect, useState } from 'react';
import { getPremiumActive, getEmail } from '@/lib/auth';
import { getPremiumStats } from '@/lib/api';
import type { PremiumStats } from '@/types/premium';

export interface UsePremiumState {
  active: boolean;
  email: string | null;
  stats: PremiumStats | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function usePremium(): UsePremiumState {
  const [active, setActive] = useState(false);
  const [email, setEmailState] = useState<string | null>(null);
  const [stats, setStats] = useState<PremiumStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, e] = await Promise.all([getPremiumActive(), getEmail()]);
    setActive(a);
    setEmailState(e);
    if (a) {
      const res = await getPremiumStats();
      if (res.data) setStats(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { active, email, stats, loading, refresh: load };
}

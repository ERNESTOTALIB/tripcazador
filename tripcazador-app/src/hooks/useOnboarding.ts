import { useCallback, useEffect, useState } from 'react';
import { isOnboardingDone, setOnboardingDone } from '@/lib/auth';

export function useOnboarding(): {
  done: boolean;
  loading: boolean;
  complete: () => Promise<void>;
} {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const d = await isOnboardingDone();
      setDone(d);
      setLoading(false);
    })();
  }, []);

  const complete = useCallback(async () => {
    await setOnboardingDone();
    setDone(true);
  }, []);

  return { done, loading, complete };
}

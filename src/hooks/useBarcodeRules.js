import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ruleFromApi } from '../utils/barcodes';
import { fetchAllPages } from './useApiList';
import useMe from './useMe';

export const RULES_URL = '/inventory/barcode-rules/?active=true';

// Per user: /auth/me/ gives the company's name, which is not unique, and a user always belongs to one company.
const storageKey = (userId) => `barcodeRules:user-${userId}`;

// Storage can be full, blocked or hold junk; the rules are then simply not cached.
function readSaved(userId) {
  try {
    const rows = JSON.parse(localStorage.getItem(storageKey(userId)));
    return Array.isArray(rows) ? rows.filter((row) => row !== null && typeof row === 'object') : undefined;
  } catch {
    return undefined;
  }
}

function save(userId, rows) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(rows));
  } catch {
    /* not cached this time */
  }
}

/**
 * The company's active scale-label rules (`/inventory/barcode-rules/?active=true`) in the parser's shape, for
 * `parseScaleLabel`. The last good copy is kept in localStorage per user, so a till that starts while the server is
 * unreachable still reads labels; it is refetched straight away. Rules are layouts, not personal data.
 *
 * @returns {{rules: Array, fromCache: boolean, isLoading: boolean, error: unknown}}
 */
export default function useBarcodeRules() {
  const userId = useMe().data?.id;
  const query = useQuery({
    queryKey: ['barcodeRules', userId],
    enabled: userId !== undefined && userId !== null,
    queryFn: async () => {
      const rows = await fetchAllPages(RULES_URL);
      if (!Array.isArray(rows)) throw new Error('Unexpected barcode rules response');
      save(userId, rows);
      return rows;
    },
    initialData: () => (userId !== undefined && userId !== null ? readSaved(userId) : undefined),
    initialDataUpdatedAt: 0, // a saved copy is always stale, so it is refetched
  });
  const rules = useMemo(() => (query.data ?? []).map(ruleFromApi), [query.data]);
  return {
    rules,
    fromCache: query.data !== undefined && query.dataUpdatedAt === 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}

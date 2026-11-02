import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ruleFromApi } from '../utils/barcodes';
import { fetchAllPages } from './useApiList';
import useMe from './useMe';

export const RULES_URL = '/inventory/barcode-rules/?active=true';

const storageKey = (company) => `barcodeRules:${company}`;

// Storage can be full, blocked or hold junk; the rules are then simply not cached.
function readSaved(company) {
  try {
    const rows = JSON.parse(localStorage.getItem(storageKey(company)));
    return Array.isArray(rows) ? rows : undefined;
  } catch {
    return undefined;
  }
}

function save(company, rows) {
  try {
    localStorage.setItem(storageKey(company), JSON.stringify(rows));
  } catch {
    /* not cached this time */
  }
}

/**
 * The company's active scale-label rules (`/inventory/barcode-rules/?active=true`) in the parser's shape, for
 * `parseScaleLabel`. The last good copy is kept in localStorage per company, so a till that starts while the server is
 * unreachable still reads labels; it is refetched straight away. Rules are layouts, not personal data.
 *
 * @returns {{rules: Array, fromCache: boolean, isLoading: boolean, error: unknown}}
 */
export default function useBarcodeRules() {
  const company = useMe().data?.company;
  const query = useQuery({
    queryKey: ['barcodeRules', company],
    enabled: Boolean(company),
    queryFn: async () => {
      const rows = await fetchAllPages(RULES_URL);
      save(company, rows);
      return rows;
    },
    initialData: () => (company ? readSaved(company) : undefined),
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

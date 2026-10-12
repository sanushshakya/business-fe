import { useQuery } from '@tanstack/react-query';
import axios from '../utils/axios';

/**
 * Fetches every page of a paginated DRF list endpoint (`{count, next, previous, results}`).
 *
 * @param {string} url - Endpoint path, e.g. `/inventory/products/`.
 * @returns {import('@tanstack/react-query').UseQueryResult<Array>}
 */
export default function useApiList(url) {
  return useQuery({
    queryKey: ['list', url],
    queryFn: async () => {
      const items = [];
      let page = 1;
      for (;;) {
        const { data } = await axios.get(url, { params: { page, page_size: 100 } });
        if (!Array.isArray(data.results)) return data;
        items.push(...data.results);
        if (!data.next) return items;
        page += 1;
      }
    },
  });
}

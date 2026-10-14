import { useQuery } from '@tanstack/react-query';
import axios from '../utils/axios';

/**
 * One page of a paginated DRF list, for tables that can grow without bound (unlike `useApiList`, which
 * walks every page). The key starts with `['list', url]`, so invalidating that prefix refreshes it.
 *
 * @param {string} url
 * @param {{page?: number, pageSize?: number, params?: object}} [options]
 */
export default function usePagedList(url, { page = 1, pageSize = 20, params = {} } = {}) {
  return useQuery({
    queryKey: ['list', url, 'page', page, pageSize, params],
    queryFn: async () => {
      const { data } = await axios.get(url, { params: { ...params, page, page_size: pageSize } });
      return data;
    },
    keepPreviousData: true,
  });
}

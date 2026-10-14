import { useQuery } from '@tanstack/react-query';
import axios from '../utils/axios';

export const ME_KEY = ['me'];

/**
 * Who is signed in (`/auth/me/`): `{id, name, email, is_staff, is_till_user, company}`. The app uses it to show
 * till users only the till. The backend enforces the same limits, so this is about not offering what would fail.
 */
export default function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => (await axios.get('/auth/me/')).data,
    staleTime: Infinity,
  });
}

import axios from './axios';

/**
 * Open a PDF the API serves (invoices, credit notes, pick lists) in a new tab. A plain link would carry no token,
 * so it is fetched through `utils/axios` (bearer token, refresh on 401) as a blob, opened, and its URL revoked.
 */
export async function openPdf(url) {
  let data;
  try {
    ({ data } = await axios.get(url, { responseType: 'blob' }));
  } catch (error) {
    // An error answer comes as a Blob too: turn it back into JSON so `apiErrorMessage` sees the server's detail.
    const body = error?.response?.data;
    if (body instanceof Blob) {
      try {
        error.response.data = JSON.parse(await body.text());
      } catch {
        // not JSON: keep the generic message
      }
    }
    throw error;
  }
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
  const link = URL.createObjectURL(blob);
  try {
    window.open(link, '_blank', 'noopener');
  } finally {
    setTimeout(() => URL.revokeObjectURL(link), 60_000); // long enough for the new tab to load it
  }
}

export default openPdf;

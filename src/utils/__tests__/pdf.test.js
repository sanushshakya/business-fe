import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../axios';
import { openPdf } from '../pdf';

vi.mock('../axios', () => ({ default: { get: vi.fn() } }));

describe('openPdf', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    URL.createObjectURL = vi.fn(() => 'blob:fake');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });
  afterEach(() => vi.useRealTimers());

  it('fetches the PDF with the token (axios), opens it and revokes the blob URL', async () => {
    axios.get.mockResolvedValue({ data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }) });
    await openPdf('/wholesale/invoices/41/pdf/');
    expect(axios.get).toHaveBeenCalledWith('/wholesale/invoices/41/pdf/', { responseType: 'blob' });
    expect(window.open).toHaveBeenCalledWith('blob:fake', '_blank', 'noopener');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it('passes a failed fetch to the caller', async () => {
    axios.get.mockRejectedValue(new Error('401'));
    await expect(openPdf('/wholesale/invoices/41/pdf/')).rejects.toThrow('401');
    expect(window.open).not.toHaveBeenCalled();
  });
});

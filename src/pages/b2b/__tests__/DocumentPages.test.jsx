import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../../utils/axios';
import { openPdf } from '../../../utils/pdf';
import CreditNotesPage from '../CreditNotesPage';
import InvoicesPage from '../InvoicesPage';

vi.mock('../../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('../../../utils/pdf', () => ({ openPdf: vi.fn(() => Promise.resolve()), default: vi.fn() }));

const page = (results) => ({ data: { results, next: null } });
const DRAFT = {
  id: 40,
  status: 'draft',
  number_display: 'Draft #40',
  order_number: 'SO-000012',
  gross_total: '10.00',
  email_status: 'not_sent',
  customer_name: '',
};
const ISSUED = {
  id: 41,
  status: 'issued',
  number_display: 'INV-000001',
  order_number: 'SO-000011',
  gross_total: '476.53',
  email_status: 'failed',
  customer_name: 'E2E Fake Bistro Ltd',
};
let rows;
let returns;

const renderPage = (Page) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Page />
    </QueryClientProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  rows = [DRAFT, ISSUED];
  returns = [];
  axios.get.mockImplementation((url) => Promise.resolve(page(url.startsWith('/wholesale/returns/') ? returns : rows)));
  axios.post.mockResolvedValue({ data: {} });
  axios.delete.mockResolvedValue({});
});

describe('InvoicesPage', () => {
  it('issues, rebuilds and deletes drafts; resends issued; opens PDFs', async () => {
    renderPage(InvoicesPage);
    expect(await screen.findByText('£476.53')).toBeTruthy();
    expect(screen.getByText('failed')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Issue Draft #40' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/invoices/40/issue/', {}));
    fireEvent.click(screen.getByRole('button', { name: 'Rebuild Draft #40' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/invoices/40/refresh/', {}));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Draft #40' }));
    await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/wholesale/invoices/40/'));
    fireEvent.click(screen.getByRole('button', { name: 'Resend INV-000001' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/invoices/41/email/', {}));
    fireEvent.click(screen.getByRole('button', { name: 'PDF INV-000001' }));
    expect(openPdf).toHaveBeenCalledWith('/wholesale/invoices/41/pdf/');
    expect(screen.queryByRole('button', { name: 'Issue INV-000001' })).toBeNull();
  });

  it('shows the server error when issuing is refused', async () => {
    axios.post.mockRejectedValue({
      response: { status: 400, data: { detail: "Set your company's VAT number before issuing invoices." } },
    });
    renderPage(InvoicesPage);
    fireEvent.click(await screen.findByRole('button', { name: 'Issue Draft #40' }));
    expect(await screen.findByText(/Set your company's VAT number/)).toBeTruthy();
  });
});

describe('CreditNotesPage', () => {
  it('drafts a credit note for a waiting return and issues a draft', async () => {
    rows = [{ ...DRAFT, number_display: 'Draft #5', id: 5, invoice_number: 'INV-000001' }];
    returns = [
      { id: 70, number_display: 'RET-000001', order_number: 'SO-000012', kind: 'later', credit_note: null },
      { id: 71, number_display: 'RET-000002', order_number: 'SO-000012', kind: 'door', credit_note: 5 },
    ];
    renderPage(CreditNotesPage);
    fireEvent.click(await screen.findByRole('button', { name: 'Draft credit note for RET-000001' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/credit-notes/', { customer_return: 70 }));
    expect(screen.queryByRole('button', { name: 'Draft credit note for RET-000002' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Issue Draft #5' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/wholesale/credit-notes/5/issue/', {}));
    expect(screen.queryByRole('button', { name: 'Rebuild Draft #5' })).toBeNull();
  });
});

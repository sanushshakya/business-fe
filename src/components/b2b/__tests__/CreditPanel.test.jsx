import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CreditPanel from '../CreditPanel';
import CustomerForm from '../CustomerForm';

const OVER = { code: 'over_limit', message: 'Over the credit limit: £12.00 owed and on order against £10.00.' };
const HOLD = { code: 'on_hold', message: 'The customer is on hold (Fake dispute).' };

describe('CreditPanel', () => {
  it('shows nothing when nothing blocks and there is no override', () => {
    const { container } = render(<CreditPanel blocks={[]} override={null} isStaff onOverride={vi.fn()} />);
    expect(container.textContent).toBe('');
  });

  it('shows why and lets staff override with a reason', async () => {
    const onOverride = vi.fn(() => Promise.resolve());
    render(
      <CreditPanel blocks={[OVER]} override={null} isStaff onOverride={onOverride} label="Override and confirm" />
    );
    expect(screen.getByText(/Over the credit limit/)).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Override and confirm' });
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Override reason'), { target: { value: ' Fake: owner agreed ' } });
    fireEvent.click(button);
    await waitFor(() => expect(onOverride).toHaveBeenCalledWith('Fake: owner agreed'));
  });

  it('never offers an override for a manual hold or to non-staff', () => {
    const { rerender } = render(<CreditPanel blocks={[HOLD]} override={null} isStaff onOverride={vi.fn()} />);
    expect(screen.getByText(/Fake dispute/)).toBeTruthy();
    expect(screen.queryByLabelText('Override reason')).toBeNull();
    expect(screen.getByText(/Take the customer off hold/)).toBeTruthy();
    rerender(<CreditPanel blocks={[OVER]} override={null} isStaff={false} onOverride={vi.fn()} />);
    expect(screen.queryByLabelText('Override reason')).toBeNull();
  });

  it('shows the override that let the order through', () => {
    render(
      <CreditPanel
        blocks={[]}
        override={{ reason: 'Fake: paid by phone', blocks: ['overdue'], created_at: '2026-11-08T10:00:00Z' }}
        isStaff
        onOverride={vi.fn()}
      />
    );
    expect(screen.getByText(/Credit override/).textContent).toContain('Fake: paid by phone');
  });
});

describe('CustomerForm credit', () => {
  it('sends the credit limit (blank as none) and the hold reason', () => {
    const onSubmit = vi.fn();
    render(<CustomerForm groups={[]} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Account code'), { target: { value: 'C-9' } });
    fireEvent.change(screen.getByLabelText('Legal name'), { target: { value: 'E2E Fake Nine Ltd' } });
    expect(screen.queryByLabelText('Hold reason')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save customer' }));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ credit_limit: null, hold_reason: '' });
    fireEvent.change(screen.getByLabelText('Credit limit (£)'), { target: { value: ' 500 ' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'on_hold' } });
    fireEvent.change(screen.getByLabelText('Hold reason'), { target: { value: 'Fake: cheque bounced' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save customer' }));
    expect(onSubmit.mock.calls[1][0]).toMatchObject({
      credit_limit: '500',
      status: 'on_hold',
      hold_reason: 'Fake: cheque bounced',
    });
  });
});

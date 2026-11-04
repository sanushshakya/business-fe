import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BreakdownList from '../BreakdownList';

const BREAKDOWN = {
  id: 1,
  reference: 'BD-000001',
  template_name: 'Fake side',
  input_product_name: 'Fake Side of Beef',
  input_batch_number: 'SIDE-1',
  input_kg: '10.000',
  loss_kg: '0.350',
  status: 'completed',
  created_at: '2026-11-04T10:00:00Z',
};

describe('BreakdownList', () => {
  it('lists breakdowns and voids one only with a reason', () => {
    const onVoid = vi.fn();
    render(
      <BreakdownList
        breakdowns={[BREAKDOWN, { ...BREAKDOWN, id: 2, reference: 'BD-000002', status: 'voided' }]}
        onVoid={onVoid}
      />
    );
    expect(screen.getByText('BD-000001')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Void/ })).toHaveLength(1); // not on the voided one
    fireEvent.click(screen.getByRole('button', { name: 'Void BD-000001' }));
    const confirm = screen.getByRole('button', { name: 'Confirm void' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Why void BD-000001?'), { target: { value: 'Fake: wrong batch' } });
    fireEvent.click(confirm);
    expect(onVoid).toHaveBeenCalledWith(BREAKDOWN, 'Fake: wrong batch');
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import VatCodeSelect from '../VatCodeSelect';

describe('VatCodeSelect', () => {
  it('offers the four VAT codes and reports a change', () => {
    const onChange = vi.fn();
    render(<VatCodeSelect productName="Fake Cola" value="zero" onChange={onChange} />);
    const select = screen.getByLabelText('VAT for Fake Cola');
    expect([...select.options].map((o) => o.value)).toEqual(['zero', 'reduced', 'standard', 'exempt']);
    fireEvent.change(select, { target: { value: 'standard' } });
    expect(onChange).toHaveBeenCalledWith('standard');
  });
});

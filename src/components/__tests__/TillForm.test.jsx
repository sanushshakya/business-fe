import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TillForm from '../TillForm';

const branches = [{ id: 2, name: 'High Street' }];
const fill = () => {
  fireEvent.change(screen.getByLabelText('Branch'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Till number'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Device ID'), { target: { value: ' dev-4 ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add till' }));
};

describe('TillForm', () => {
  it('submits the till and clears the fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<TillForm branches={branches} onSubmit={onSubmit} />);
    fill();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ branch: 2, number: 4, device_id: 'dev-4' }));
    await waitFor(() => expect(screen.getByLabelText('Till number')).toHaveValue(null));
  });

  it('keeps what was typed when the save fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('403'));
    render(<TillForm branches={branches} onSubmit={onSubmit} />);
    fill();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByLabelText('Till number')).toHaveValue(4);
  });
});

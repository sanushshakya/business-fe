import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WeightEntry, { normaliseKg } from '../WeightEntry';

const mince = { id: 4, name: 'Mince', sold_by: 'weight', price_per_kg: '8.9900' };
const legs = { ...mince, id: 5, name: 'Lamb Legs', is_catch_weight: true, price_per_kg: '12.0000' };

describe('normaliseKg', () => {
  it('accepts up to 3 decimals and pads to grams', () => {
    expect(normaliseKg('0.5')).toBe('0.500');
    expect(normaliseKg(' 1.25 ')).toBe('1.250');
    expect(normaliseKg('2')).toBe('2.000');
    expect(normaliseKg('.512')).toBe('0.512');
    expect(normaliseKg('0,512')).toBe('0.512');
  });
  it('refuses what is not a weight', () => {
    ['', '0', '0.000', '0.5125', 'abc', '-1', '1.2.3', '1000'].forEach((text) => expect(normaliseKg(text)).toBeNull());
  });
});

describe('WeightEntry', () => {
  it('adds a typed weight and shows the price as you type', () => {
    const onAdd = vi.fn();
    render(<WeightEntry product={mince} onAdd={onAdd} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '0.512' } });
    expect(screen.getByText('0.512 kg × £8.99/kg = £4.60')).toBeInTheDocument();
    expect(screen.queryByLabelText('Pieces')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Mince' }));
    expect(onAdd).toHaveBeenCalledWith({ weightKg: '0.512', pieces: null });
  });

  it('says what is wrong and adds nothing', () => {
    const onAdd = vi.fn();
    render(<WeightEntry product={mince} onAdd={onAdd} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '0.5125' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Mince' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Type the weight in kg, up to 3 decimals (e.g. 0.512).');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('asks for pieces on a catch-weight product', () => {
    const onAdd = vi.fn();
    render(<WeightEntry product={legs} onAdd={onAdd} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '4.8' } });
    fireEvent.change(screen.getByLabelText('Pieces'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Lamb Legs' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Say how many pieces');
    fireEvent.change(screen.getByLabelText('Pieces'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Lamb Legs' }));
    expect(onAdd).toHaveBeenCalledWith({ weightKg: '4.800', pieces: 2 });
  });

  it('can be cancelled', () => {
    const onCancel = vi.fn();
    render(<WeightEntry product={mince} onAdd={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});

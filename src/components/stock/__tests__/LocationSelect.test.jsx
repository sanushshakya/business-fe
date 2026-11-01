import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LocationSelect, { locationLabel } from '../LocationSelect';
import { LOCATIONS } from './fixtures';

const options = () => screen.getAllByRole('option').map((option) => option.textContent);

describe('LocationSelect', () => {
  it('lists real, active locations as "CODE · name"', () => {
    render(<LocationSelect id="loc" label="Location" locations={LOCATIONS} value="" onChange={() => {}} />);
    expect(options()).toEqual([
      'Choose a location',
      'SHOP-1 · Fake shop floor',
      'BUT-1 · Fake butchery',
      'WH-1 · Fake warehouse',
    ]);
  });

  it('offers only store locations with filter="store", and drops excluded ones', () => {
    render(
      <LocationSelect
        id="loc"
        label="Store"
        locations={LOCATIONS}
        filter="store"
        exclude={8}
        value=""
        onChange={() => {}}
      />
    );
    expect(options()).toEqual(['Choose a location', 'SHOP-1 · Fake shop floor']);
  });

  it('can offer "all" and reports the chosen id as a number', () => {
    const onChange = vi.fn();
    render(
      <LocationSelect
        id="loc"
        label="Location"
        locations={LOCATIONS}
        allLabel="All locations"
        value=""
        onChange={onChange}
      />
    );
    expect(options()[0]).toBe('All locations');
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: '9' } });
    expect(onChange).toHaveBeenCalledWith(9);
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('labels a location', () => {
    expect(locationLabel(LOCATIONS[0])).toBe('SHOP-1 · Fake shop floor');
    expect(locationLabel(undefined)).toBe('?');
  });
});

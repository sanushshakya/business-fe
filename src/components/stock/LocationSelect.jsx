import React from 'react';
import { Select } from '@/components/ui';

/** Where a store keeps stock: the only locations that raise requisitions (backend `Location.BRANCH_TYPES`). */
export const STORE_TYPES = ['shop_floor', 'butchery', 'back_store'];

export const locationLabel = (location) => (location ? `${location.code} · ${location.name}` : '?');

/** Real (not virtual), active locations; `filter="store"` keeps only store ones. */
export const usableLocations = (locations, filter = 'real') =>
  (locations || []).filter(
    (location) =>
      !location.is_virtual && location.is_active && (filter !== 'store' || STORE_TYPES.includes(location.type))
  );

/**
 * Dropdown of the company's locations (already fetched, passed in). `onChange` receives the id (number) or ''.
 * `allLabel` names the empty choice (e.g. "All locations"); `exclude` drops one id (e.g. the destination).
 */
const LocationSelect = ({ id, label, locations, value, onChange, filter = 'real', allLabel, exclude, ...props }) => (
  <Select
    id={id}
    aria-label={label}
    value={value ?? ''}
    onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
    {...props}
  >
    <option value="">{allLabel || 'Choose a location'}</option>
    {usableLocations(locations, filter)
      .filter((location) => location.id !== exclude)
      .map((location) => (
        <option key={location.id} value={location.id}>
          {locationLabel(location)}
        </option>
      ))}
  </Select>
);

export default LocationSelect;

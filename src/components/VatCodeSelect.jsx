// src/components/VatCodeSelect.jsx

import React from 'react';
import { Option, Select } from '@/components/ui';
import { VAT_CODES } from '../utils/vat';

/** The VAT code of one product. The code decides the rate (the backend's rate table), not the category. */
const VatCodeSelect = ({ productName, value, onChange, disabled = false }) => (
  <Select
    aria-label={`VAT for ${productName}`}
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
  >
    {VAT_CODES.map(({ code, label }) => (
      <Option key={code} value={code}>
        {label}
      </Option>
    ))}
  </Select>
);

export default VatCodeSelect;

// src/utils/vat.js

/** UK VAT codes as the backend stores them (`Product.vat_code`), with a label and the receipt letter. */
export const VAT_CODES = [
  { code: 'zero', label: 'Zero-rated', letter: 'Z' },
  { code: 'reduced', label: 'Reduced', letter: 'R' },
  { code: 'standard', label: 'Standard', letter: 'S' },
  { code: 'exempt', label: 'Exempt', letter: 'E' },
];

export const vatLetter = (code) => VAT_CODES.find((v) => v.code === code)?.letter ?? '';

// Barcode parsers for the till (G17): scale labels (EAN-13 `2…`) and GS1 element strings. Ports of the backend's
// `inventory/barcode_parser.py` and `inventory/gs1_parser.py`, tested against the same `barcode_fixtures.json`.
export * from './decimal';
export * from './ean13';
export * from './gs1';

/** Fake locations and products shared by the stock screen tests. */
export const LOCATIONS = [
  { id: 7, code: 'SHOP-1', name: 'Fake shop floor', type: 'shop_floor', is_active: true, is_virtual: false },
  { id: 8, code: 'BUT-1', name: 'Fake butchery', type: 'butchery', is_active: true, is_virtual: false },
  { id: 9, code: 'WH-1', name: 'Fake warehouse', type: 'warehouse', is_active: true, is_virtual: false },
  { id: 10, code: 'OLD-1', name: 'Fake closed store', type: 'back_store', is_active: false, is_virtual: false },
  { id: 11, code: 'IN-TRANSIT', name: 'In transit', type: 'in_transit', is_active: true, is_virtual: true },
];

export const PRODUCTS = [
  { id: 4, name: 'Fake dates', price: '8.99', stock_quantity: 50, reorder_threshold: 10, vat_code: 'zero' },
  { id: 5, name: 'Fake rice', price: '2.50', stock_quantity: 20, reorder_threshold: 5, vat_code: 'zero' },
];

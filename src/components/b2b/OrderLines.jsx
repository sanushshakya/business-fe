import React from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { formatMoney } from '../../utils/money';

const amount = (line) => {
  if (line.quantity == null) return `${line.weight_kg} kg`;
  return line.weight_kg ? `${line.quantity} pcs (~${line.weight_kg} kg)` : String(line.quantity);
};

const picked = (line) => {
  if (line.picked_quantity == null && line.picked_weight_kg == null) return '—';
  if (line.picked_quantity == null) return `${line.picked_weight_kg} kg`;
  return line.picked_weight_kg
    ? `${line.picked_quantity} pcs, ${line.picked_weight_kg} kg`
    : String(line.picked_quantity);
};

/** An order's lines (G40–G42): ordered, trade price once confirmed, reserved/short, and what was picked. */
const OrderLines = ({ lines }) => (
  <Table>
    <Thead>
      <Tr>
        <Th>Product</Th>
        <Th>Ordered</Th>
        <Th>Price (ex VAT)</Th>
        <Th>Net</Th>
        <Th>Reserved</Th>
        <Th>Picked</Th>
      </Tr>
    </Thead>
    <Tbody>
      {lines.map((line) => (
        <Tr key={line.id}>
          <Td>
            {line.product_name}
            {line.substitution && <span className="ml-2 text-xs text-gray-500">swap: {line.substitution}</span>}
          </Td>
          <Td>{amount(line)}</Td>
          <Td>{line.unit_price ? `£${line.unit_price}` : '—'}</Td>
          <Td>{line.estimated_net ? formatMoney(line.estimated_net) : '—'}</Td>
          <Td>
            {line.reserved == null ? '—' : line.reserved}
            {line.short && Number(line.short) > 0 && <span className="ml-1 text-red-600">short {line.short}</span>}
          </Td>
          <Td>{picked(line)}</Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);

export default OrderLines;

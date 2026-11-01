import React from 'react';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { productName } from './LineEditor';
import { STATUS_COLORS, codeOf, statusLabel } from './TransferTable';

const FULFILLABLE = ['open', 'partly_fulfilled'];

/** Requisitions with what is still open per line, the transfers made for them, and Fulfil while anything is open. */
const RequisitionTable = ({ requisitions, locations, products, transferReferences = {}, onFulfil, busy = false }) => (
  <Table>
    <Thead>
      <Tr>
        <Th>Requisition</Th>
        <Th>Store</Th>
        <Th>Lines</Th>
        <Th>Status</Th>
        <Th>Transfers</Th>
        <Th />
      </Tr>
    </Thead>
    <Tbody>
      {requisitions.map((requisition) => (
        <Tr key={requisition.id}>
          <Td>
            {requisition.reference}
            {requisition.note && <div className="text-xs text-gray-500">{requisition.note}</div>}
          </Td>
          <Td>{codeOf(locations, requisition.location)}</Td>
          <Td>
            {requisition.lines.map((line) => (
              <div key={line.id}>
                {productName(products, line.product)}: {line.open_quantity} open of {line.quantity}
              </div>
            ))}
          </Td>
          <Td>
            <Badge color={STATUS_COLORS[requisition.status]}>{statusLabel(requisition.status)}</Badge>
          </Td>
          <Td>{requisition.transfers.map((id) => transferReferences[id] ?? `#${id}`).join(', ') || '—'}</Td>
          <Td className="text-right">
            {FULFILLABLE.includes(requisition.status) && (
              <Button disabled={busy} onClick={() => onFulfil(requisition)}>
                Fulfil
              </Button>
            )}
          </Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);

export default RequisitionTable;

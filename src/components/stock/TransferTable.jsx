import React from 'react';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { productName } from './LineEditor';

export const STATUS_COLORS = {
  draft: 'gray',
  dispatched: 'yellow',
  received: 'green',
  cancelled: 'red',
  open: 'gray',
  partly_fulfilled: 'yellow',
  fulfilled: 'green',
};

export const statusLabel = (status) => status.replace('_', ' ').replace(/^./, (c) => c.toUpperCase());

export const codeOf = (locations, id) => (locations || []).find((location) => location.id === id)?.code ?? `#${id}`;

const lineText = (line, products) => {
  const name = productName(products, line.product);
  return line.received_quantity == null
    ? `${line.quantity} × ${name}`
    : `${line.received_quantity} of ${line.quantity} × ${name}`;
};

/** Transfers with the next step for each: a draft is dispatched or cancelled, a dispatched one received. */
const TransferTable = ({ transfers, locations, products, onDispatch, onCancel, onReceive, busy = false }) => (
  <Table>
    <Thead>
      <Tr>
        <Th>Transfer</Th>
        <Th>Route</Th>
        <Th>Lines</Th>
        <Th>Status</Th>
        <Th />
      </Tr>
    </Thead>
    <Tbody>
      {transfers.map((transfer) => (
        <Tr key={transfer.id}>
          <Td>
            {transfer.reference}
            {transfer.note && <div className="text-xs text-gray-500">{transfer.note}</div>}
          </Td>
          <Td>
            {codeOf(locations, transfer.source_location)} → {codeOf(locations, transfer.destination_location)}
          </Td>
          <Td>
            {transfer.lines.map((line) => (
              <div key={line.id} title={line.difference_reason || undefined}>
                {lineText(line, products)}
              </div>
            ))}
          </Td>
          <Td>
            <Badge color={STATUS_COLORS[transfer.status]}>{statusLabel(transfer.status)}</Badge>
          </Td>
          <Td className="space-x-2 whitespace-nowrap text-right">
            {transfer.status === 'draft' && (
              <>
                <Button disabled={busy} onClick={() => onDispatch(transfer)}>
                  Dispatch
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => onCancel(transfer)}>
                  Cancel
                </Button>
              </>
            )}
            {transfer.status === 'dispatched' && (
              <Button disabled={busy} onClick={() => onReceive(transfer)}>
                Receive
              </Button>
            )}
          </Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);

export default TransferTable;

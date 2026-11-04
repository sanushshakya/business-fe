import React from 'react';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { formatMoney } from '../../utils/money';
import { REASONS } from './WriteOffForm';

const REASON_LABELS = Object.fromEntries(REASONS);
const STATUS = {
  pending: ['yellow', 'Waiting for approval'],
  written_off: ['green', 'Written off'],
  rejected: ['gray', 'Rejected'],
};

/**
 * Write-offs. Staff decide pending ones raised by someone else (the server refuses your own); `onDecide(writeOff,
 * 'approve' | 'reject')`.
 */
const WriteOffList = ({ writeOffs = [], me = {}, onDecide, busy = false }) => (
  <Table>
    <Thead>
      <Tr>
        <Th>Reference</Th>
        <Th>Stock</Th>
        <Th>Reason</Th>
        <Th>Amount</Th>
        <Th>Cost</Th>
        <Th>Status</Th>
        <Th />
      </Tr>
    </Thead>
    <Tbody>
      {writeOffs.map((writeOff) => {
        const [color, label] = STATUS[writeOff.status] ?? ['gray', writeOff.status];
        const pending = writeOff.status === 'pending';
        const mine = writeOff.created_by === me.id;
        return (
          <Tr key={writeOff.id}>
            <Td>{writeOff.reference}</Td>
            <Td>
              {writeOff.product_name} · {writeOff.batch_number}
            </Td>
            <Td>{REASON_LABELS[writeOff.reason] ?? writeOff.reason}</Td>
            <Td>{writeOff.quantity ? `${writeOff.quantity}` : `${writeOff.weight_kg} kg`}</Td>
            <Td>{writeOff.cost == null ? 'No cost' : formatMoney(writeOff.cost)}</Td>
            <Td>
              <Badge color={color}>{label}</Badge>
            </Td>
            <Td>
              {pending && me.is_staff && !mine && (
                <div className="flex gap-2">
                  <Button
                    disabled={busy}
                    onClick={() => onDecide(writeOff, 'approve')}
                    aria-label={`Approve ${writeOff.reference}`}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onDecide(writeOff, 'reject')}
                    aria-label={`Reject ${writeOff.reference}`}
                  >
                    Reject
                  </Button>
                </div>
              )}
              {pending && me.is_staff && mine && <span className="text-xs text-gray-500">Needs another manager</span>}
            </Td>
          </Tr>
        );
      })}
    </Tbody>
  </Table>
);

export default WriteOffList;

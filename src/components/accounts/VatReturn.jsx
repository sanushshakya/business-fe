import React from 'react';
import { Button, Card, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { money, pounds } from './money';

const BOXES = [
  ['box1', 'VAT due on sales', money],
  ['box2', 'VAT due on acquisitions from the EU', money],
  ['box3', 'Total VAT due (boxes 1 + 2)', money],
  ['box4', 'VAT reclaimed on purchases', money],
  ['box5', 'Net VAT', money],
  ['box6', 'Total sales excluding VAT', pounds],
  ['box7', 'Total purchases excluding VAT', pounds],
  ['box8', 'Goods supplied to the EU excluding VAT', pounds],
  ['box9', 'Goods acquired from the EU excluding VAT', pounds],
];

/**
 * The nine-box VAT return (G54) for the period. Staff mark it filed (a second click confirms): the server stores the
 * boxes as they are and locks those months. Shows the filed return when there is one.
 */
const VatReturn = ({ data, isStaff, onFile, busy = false }) => {
  const [confirming, setConfirming] = React.useState(false);
  const shown = data.filed ?? data;
  const file = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onFile();
  };

  return (
    <div className="space-y-4">
      <Table aria-label="VAT return">
        <Thead>
          <Tr>
            <Th>Box</Th>
            <Th>What</Th>
            <Th className="text-right">Amount</Th>
          </Tr>
        </Thead>
        <Tbody>
          {BOXES.map(([key, label, format], index) => (
            <Tr key={key}>
              <Td>{index + 1}</Td>
              <Td>
                {label}
                {key === 'box5' && ` (${shown.net_direction === 'reclaim' ? 'to reclaim' : 'to pay'})`}
              </Td>
              <Td className="text-right tabular-nums">{format(shown[key])}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {!data.filed && Number(data.suspense) !== 0 && (
        <p role="status" className="text-sm text-amber-700">
          {money(data.suspense)} went through Suspense in this period (e.g. till sales with no VAT recorded): it is in
          no box. Check it with your accountant before filing.
        </p>
      )}
      {data.filed ? (
        <Card className="p-4 text-sm">
          Filed on {new Date(data.filed.filed_at).toLocaleString('en-GB', { timeZone: 'Europe/London' })}; its months
          are locked.
        </Card>
      ) : (
        isStaff && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Button disabled={busy} onClick={file}>
              {confirming ? 'Yes, mark as filed and lock these months' : 'Mark as filed'}
            </Button>
            {confirming && (
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Not yet
              </Button>
            )}
            <span className="text-gray-600">Whole months that have ended; the figures are kept as they are.</span>
          </div>
        )
      )}
    </div>
  );
};

export default VatReturn;

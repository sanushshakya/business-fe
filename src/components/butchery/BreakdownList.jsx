import React from 'react';
import { Badge, Button, Input, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';

/** Recent breakdowns. Void needs a reason; the server refuses it once an output has been sold or moved. */
const BreakdownList = ({ breakdowns = [], onVoid, busy = false }) => {
  const [voiding, setVoiding] = React.useState(null);
  const [reason, setReason] = React.useState('');

  const start = (breakdown) => {
    setVoiding(breakdown.id);
    setReason('');
  };

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Reference</Th>
          <Th>Input</Th>
          <Th>kg in</Th>
          <Th>Loss kg</Th>
          <Th>Status</Th>
          <Th />
        </Tr>
      </Thead>
      <Tbody>
        {breakdowns.map((breakdown) => (
          <Tr key={breakdown.id}>
            <Td>{breakdown.reference}</Td>
            <Td>
              {breakdown.input_product_name} · {breakdown.input_batch_number}
            </Td>
            <Td>{breakdown.input_kg}</Td>
            <Td>{breakdown.loss_kg}</Td>
            <Td>
              <Badge color={breakdown.status === 'voided' ? 'gray' : 'green'}>
                {breakdown.status === 'voided' ? 'Voided' : 'Recorded'}
              </Badge>
            </Td>
            <Td>
              {breakdown.status === 'completed' && voiding !== breakdown.id && (
                <Button variant="secondary" onClick={() => start(breakdown)} aria-label={`Void ${breakdown.reference}`}>
                  Void
                </Button>
              )}
              {voiding === breakdown.id && (
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`Why void ${breakdown.reference}?`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-48"
                  />
                  <Button
                    variant="danger"
                    disabled={!reason.trim() || busy}
                    onClick={() => {
                      onVoid(breakdown, reason.trim());
                      setVoiding(null);
                    }}
                  >
                    Confirm void
                  </Button>
                  <Button variant="secondary" onClick={() => setVoiding(null)}>
                    Keep
                  </Button>
                </div>
              )}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default BreakdownList;

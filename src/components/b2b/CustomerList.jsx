import React from 'react';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { STATUSES } from './CustomerForm';

const STATUS_LABELS = Object.fromEntries(STATUSES);
const STATUS_COLOURS = { active: 'green', on_hold: 'yellow', closed: 'gray' };

/** Trade customers (G38) as a table, with their group, status and payment terms. */
const CustomerList = ({ customers, groups = [], onEdit }) => {
  const groupNames = Object.fromEntries(groups.map((group) => [group.id, group.name]));
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Code</Th>
          <Th>Name</Th>
          <Th>Group</Th>
          <Th>Status</Th>
          <Th>Terms</Th>
          <Th />
        </Tr>
      </Thead>
      <Tbody>
        {customers.map((customer) => (
          <Tr key={customer.id}>
            <Td className="font-mono">{customer.account_code}</Td>
            <Td>{customer.trading_name || customer.legal_name}</Td>
            <Td>{groupNames[customer.group] ?? '—'}</Td>
            <Td>
              <Badge color={STATUS_COLOURS[customer.status]}>{STATUS_LABELS[customer.status]}</Badge>
            </Td>
            <Td>{customer.payment_terms_days} days</Td>
            <Td className="text-right">
              <Button variant="secondary" onClick={() => onEdit(customer)} aria-label={`Edit ${customer.account_code}`}>
                Edit
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default CustomerList;

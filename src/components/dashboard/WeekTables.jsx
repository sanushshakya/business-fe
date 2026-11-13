import React from 'react';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui';
import { formatCents, toCents } from '../../utils/money';

const CHANNELS = { till: 'Till', trade: 'Trade', online: 'Online' };

/** Pence change from last week; `null` when there is nothing to compare. */
const change = (now, before) => toCents(now ?? '0') - toCents(before ?? '0');
const signed = (cents) => `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${formatCents(Math.abs(cents))}`;
const money = (value) => (value === null || value === undefined ? '—' : formatCents(toCents(value)));
const percent = (value) => (value === null || value === undefined ? '—' : `${value}%`);

/** This week's rows joined with last week's by `key`, in this week's order then any only last week had. */
export const joinWeeks = (current = [], previous = [], key) => {
  const before = new Map(previous.map((row) => [key(row), row]));
  const seen = new Set();
  const joined = current.map((row) => {
    seen.add(key(row));
    return { key: key(row), row, before: before.get(key(row)) ?? null };
  });
  for (const row of previous) if (!seen.has(key(row))) joined.push({ key: key(row), row: null, before: row });
  return joined;
};

const placeName = ({ row, before }) => {
  const r = row ?? before;
  return r.location_code ? `${r.branch_name} · ${r.location_code}` : r.branch_name;
};

const ChangeCell = ({ now, before }) => {
  const cents = change(now, before);
  return <Td className={cents < 0 ? 'text-red-700' : cents > 0 ? 'text-green-700' : ''}>{signed(cents)}</Td>;
};

/** Sales and margin by channel and place (ex VAT); uncosted sales are shown apart from the margin. */
export const SalesTable = ({ current, previous, totals, previousTotals }) => {
  const rows = joinWeeks(current, previous, (r) => `${r.channel}|${r.branch}|${r.location}`);
  return (
    <Table aria-label="Sales and margin">
      <Thead>
        <Tr>
          <Th>Channel</Th>
          <Th>Where</Th>
          <Th>Sales (ex VAT)</Th>
          <Th>Last week</Th>
          <Th>Change</Th>
          <Th>Margin</Th>
          <Th>Margin %</Th>
          <Th>Uncosted sales</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map(({ key, row, before }) => (
          <Tr key={key}>
            <Td>{CHANNELS[(row ?? before).channel]}</Td>
            <Td>{placeName({ row, before })}</Td>
            <Td>{money(row?.net ?? '0')}</Td>
            <Td>{money(before?.net ?? '0')}</Td>
            <ChangeCell now={row?.net} before={before?.net} />
            <Td>{row ? money(row.margin) : '—'}</Td>
            <Td>{percent(row?.margin_percent)}</Td>
            <Td>{row && toCents(row.uncosted_net) ? money(row.uncosted_net) : '—'}</Td>
          </Tr>
        ))}
        <Tr className="font-semibold">
          <Td>Total</Td>
          <Td />
          <Td>{money(totals.net)}</Td>
          <Td>{money(previousTotals.net)}</Td>
          <ChangeCell now={totals.net} before={previousTotals.net} />
          <Td>{money(totals.margin)}</Td>
          <Td>{percent(totals.margin_percent)}</Td>
          <Td>{toCents(totals.uncosted_net) ? money(totals.uncosted_net) : '—'}</Td>
        </Tr>
      </Tbody>
    </Table>
  );
};

/** Write-offs by location: known cost against last week. */
export const WasteTable = ({ current, previous, totals, previousTotals }) => {
  const rows = joinWeeks(current, previous, (r) => String(r.location));
  return (
    <Table aria-label="Waste">
      <Thead>
        <Tr>
          <Th>Location</Th>
          <Th>Write-offs</Th>
          <Th>Cost</Th>
          <Th>Last week</Th>
          <Th>Change</Th>
          <Th>No cost known</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map(({ key, row, before }) => (
          <Tr key={key}>
            <Td>{placeName({ row, before })}</Td>
            <Td>{row?.count ?? 0}</Td>
            <Td>{money(row?.cost ?? '0')}</Td>
            <Td>{money(before?.cost ?? '0')}</Td>
            <ChangeCell now={row?.cost} before={before?.cost} />
            <Td>{row?.uncosted ? row.uncosted : '—'}</Td>
          </Tr>
        ))}
        <Tr className="font-semibold">
          <Td>Total</Td>
          <Td />
          <Td>{money(totals.waste_cost)}</Td>
          <Td>{money(previousTotals.waste_cost)}</Td>
          <ChangeCell now={totals.waste_cost} before={previousTotals.waste_cost} />
          <Td />
        </Tr>
      </Tbody>
    </Table>
  );
};

const uncostedText = (row) => {
  if (!row) return '—';
  const parts = [];
  if (row.uncosted_units) parts.push(`${row.uncosted_units} units`);
  if (Number(row.uncosted_kg)) parts.push(`${row.uncosted_kg} kg`);
  return parts.length ? parts.join(', ') : '—';
};

/** Stock value by location at the end of each period. */
export const StockTable = ({ current, previous, totals, previousTotals }) => {
  const rows = joinWeeks(current, previous, (r) => String(r.location));
  return (
    <Table aria-label="Stock value">
      <Thead>
        <Tr>
          <Th>Location</Th>
          <Th>Value</Th>
          <Th>Last week</Th>
          <Th>Change</Th>
          <Th>No cost known</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map(({ key, row, before }) => (
          <Tr key={key}>
            <Td>{placeName({ row, before })}</Td>
            <Td>{money(row?.value ?? '0')}</Td>
            <Td>{money(before?.value ?? '0')}</Td>
            <ChangeCell now={row?.value} before={before?.value} />
            <Td>{uncostedText(row)}</Td>
          </Tr>
        ))}
        <Tr className="font-semibold">
          <Td>Total</Td>
          <Td>{money(totals.stock_value)}</Td>
          <Td>{money(previousTotals.stock_value)}</Td>
          <ChangeCell now={totals.stock_value} before={previousTotals.stock_value} />
          <Td />
        </Tr>
      </Tbody>
    </Table>
  );
};

import React from 'react';
import { Button, Input, Select } from '@/components/ui';
import LocationSelect from '../stock/LocationSelect';
import { formatGrams, toGrams } from '../../utils/kg';
import { ukDay } from './BreakdownForm';

export const REASONS = [
  ['expired', 'Expired'],
  ['damaged', 'Damaged'],
  ['trim', 'Trim'],
  ['quality', 'Quality'],
  ['theft', 'Theft'],
  ['sample', 'Sample'],
]; // the backend's WriteOff.REASONS

/**
 * Write stock off from one batch (G23): a quantity for each products (pieces for catch-weight), kg for loose ones.
 * `onSubmit` gets the POST /inventory/write-offs/ body and resolves with the saved write-off, whose status says
 * whether it moved now or waits for a manager's approval (over the company's £ threshold, or no known cost).
 */
const WriteOffForm = ({
  locations = [],
  location = '',
  onLocationChange,
  batches = [],
  products = [],
  onSubmit,
  submitting = false,
  error = null,
}) => {
  const [batchId, setBatchId] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState('');
  const [problem, setProblem] = React.useState('');
  const [result, setResult] = React.useState('');

  const productById = React.useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const batch = batches.find((b) => String(b.id) === batchId);
  const product = batch && productById[batch.product];
  const loose = Boolean(product && product.sold_by === 'weight' && !product.is_catch_weight);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setResult('');
    if (!batch || !reason) return setProblem('Choose a batch and a reason.');
    const grams = toGrams(amount);
    const quantity = Number(amount);
    if (loose ? grams === null : !(Number.isInteger(quantity) && quantity >= 1))
      return setProblem(loose ? 'Type the kg (up to 3 decimals).' : 'Say how many.');
    setProblem('');
    const body = {
      batch: batch.id,
      reason,
      ...(loose ? { weight_kg: formatGrams(grams) } : { quantity }),
      note: note.trim(),
    };
    let saved;
    try {
      saved = await onSubmit(body);
    } catch {
      return undefined; // the page shows the error; keep what was typed
    }
    setResult(
      saved?.status === 'pending'
        ? `${saved.reference} is waiting for a manager to approve it.`
        : `${saved?.reference ?? 'It'} written off.`
    );
    setBatchId('');
    setAmount('');
    setNote('');
    return undefined;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="writeoff-location" className="mb-1 block text-sm font-medium">
            Location
          </label>
          <LocationSelect
            id="writeoff-location"
            label="Location"
            locations={locations}
            value={location}
            onChange={onLocationChange}
            className="h-12 text-lg"
          />
        </div>
        <div>
          <label htmlFor="writeoff-batch" className="mb-1 block text-sm font-medium">
            Batch
          </label>
          <Select
            id="writeoff-batch"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="h-12 text-lg"
          >
            <option value="">Choose a batch</option>
            {batches.map((b) => {
              const p = productById[b.product];
              const held = p?.sold_by === 'weight' && !p?.is_catch_weight ? `${b.weight_kg} kg` : `${b.quantity}`;
              return (
                <option key={b.id} value={b.id}>
                  {p?.name ?? '?'} · {b.batch_number} · {held} · use by {ukDay(b.expiration_date)}
                </option>
              );
            })}
          </Select>
        </div>
        <div>
          <label htmlFor="writeoff-reason" className="mb-1 block text-sm font-medium">
            Reason
          </label>
          <Select
            id="writeoff-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-12 text-lg"
          >
            <option value="">Choose a reason</option>
            {REASONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        {batch && (
          <div>
            <label htmlFor="writeoff-amount" className="mb-1 block text-sm font-medium">
              {loose ? 'Weight (kg)' : 'Quantity'}
            </label>
            <Input
              id="writeoff-amount"
              inputMode={loose ? 'decimal' : 'numeric'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-lg"
            />
          </div>
        )}
      </div>
      <div>
        <label htmlFor="writeoff-note" className="mb-1 block text-sm font-medium">
          Note (optional)
        </label>
        <Input id="writeoff-note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {(problem || error) && (
        <p role="alert" className="text-sm text-red-600">
          {problem || error}
        </p>
      )}
      {result && (
        <p role="status" className="text-sm text-green-700">
          {result}
        </p>
      )}
      <Button type="submit" className="h-12 w-full text-base" disabled={submitting}>
        {submitting ? 'Saving…' : 'Write off'}
      </Button>
    </form>
  );
};

export default WriteOffForm;

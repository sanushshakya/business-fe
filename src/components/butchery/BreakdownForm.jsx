import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button, Input, Select } from '@/components/ui';
import LocationSelect from '../stock/LocationSelect';
import { formatGrams, percentOf, toGrams } from '../../utils/kg';

/** `'2026-11-10'` → `'10/11/2026'`. */
export const ukDay = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

const bigInput = 'h-12 text-lg';

/** The kg a catch-weight input of `pieces` takes from `batch` (the batch's average per piece; the last take all). */
const pieceGrams = (batch, pieces) => {
  const grams = toGrams(batch.weight_kg) ?? 0;
  if (!pieces || !batch.quantity) return 0;
  if (pieces >= batch.quantity) return grams;
  return Math.round((grams * pieces) / batch.quantity);
};

/**
 * Record a butchery breakdown (G21) on a tablet: pick the template and the input batch at the chosen butchery
 * location, type the kg of each output (and pieces for catch-weight), see the loss against the template's expected
 * loss, and record. `onSubmit` gets the POST /inventory/breakdowns/ body; its `client_ref` is reused while the
 * breakdown is unchanged, so a retry after a lost answer is not booked twice. The server checks everything again;
 * `error` is its answer, shown here.
 */
const BreakdownForm = ({
  locations = [],
  location = '',
  onLocationChange,
  templates = [],
  batches = [],
  products = [],
  onSubmit,
  submitting = false,
  error = null,
}) => {
  const [templateId, setTemplateId] = React.useState('');
  const [batchId, setBatchId] = React.useState('');
  const [inputKg, setInputKg] = React.useState('');
  const [inputPieces, setInputPieces] = React.useState('');
  const [rows, setRows] = React.useState({});
  const [lossReason, setLossReason] = React.useState('');
  const [problem, setProblem] = React.useState('');
  const attempt = React.useRef(null);

  const productById = React.useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const template = templates.find((t) => String(t.id) === templateId);
  const usable = template ? batches.filter((b) => b.product === template.input_product) : [];
  const batch = usable.find((b) => String(b.id) === batchId);
  const catchInput = Boolean(template && productById[template.input_product]?.is_catch_weight);
  const outputs = template?.outputs ?? [];
  const label = (output) => (output.kind === 'product' ? (productById[output.product]?.name ?? '?') : output.name);
  const catchOutput = (output) => output.kind === 'product' && Boolean(productById[output.product]?.is_catch_weight);

  const chooseTemplate = (value) => {
    setTemplateId(value);
    setBatchId('');
    setRows({});
  };
  const chooseBatch = (value) => {
    setBatchId(value);
    const chosen = usable.find((b) => String(b.id) === value);
    setInputKg(chosen ? formatGrams(toGrams(chosen.weight_kg) ?? 0) : '');
    setInputPieces(chosen ? String(chosen.quantity) : '');
  };
  const setRow = (id, field, value) => setRows((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));

  const pieces = Number(inputPieces);
  const inputGrams = batch ? (catchInput ? pieceGrams(batch, pieces) : (toGrams(inputKg) ?? 0)) : 0;
  const outputGrams = outputs.reduce((sum, o) => sum + (toGrams(rows[o.id]?.kg) ?? 0), 0);
  const lossGrams = inputGrams - outputGrams;
  const expectedLoss = template ? Number(template.expected_loss_percent).toFixed(1) : null;

  const body = () => {
    const lines = outputs
      .filter((o) => (rows[o.id]?.kg ?? '').trim() !== '')
      .map((o) => {
        const line = { output: o.id, weight_kg: formatGrams(toGrams(rows[o.id].kg) ?? 0) };
        if (catchOutput(o)) line.pieces = Number(rows[o.id]?.pieces || 0);
        return line;
      });
    return {
      template: template.id,
      location: Number(location),
      input_batch: batch.id,
      ...(catchInput ? { input_pieces: pieces } : { input_kg: formatGrams(toGrams(inputKg) ?? 0) }),
      lines,
      loss_reason: lossReason.trim(),
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!template || !batch) return setProblem('Choose a template and an input batch.');
    if (catchInput ? !(Number.isInteger(pieces) && pieces >= 1) : toGrams(inputKg) === null)
      return setProblem(catchInput ? 'Say how many pieces go in.' : 'Type the input kg (up to 3 decimals).');
    const bad = outputs.find((o) => (rows[o.id]?.kg ?? '').trim() !== '' && toGrams(rows[o.id].kg) === null);
    if (bad) return setProblem(`Check the kg for ${label(bad)}.`);
    setProblem('');
    const payload = body();
    const key = JSON.stringify(payload);
    if (attempt.current?.key !== key) attempt.current = { key, ref: uuidv4() };
    try {
      await onSubmit({ ...payload, client_ref: attempt.current.ref });
    } catch {
      return undefined; // the page shows the error; keep what was typed and the client_ref
    }
    attempt.current = null;
    setTemplateId('');
    setBatchId('');
    setRows({});
    setLossReason('');
    return undefined;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="breakdown-location" className="mb-1 block text-sm font-medium">
            Butchery
          </label>
          <LocationSelect
            id="breakdown-location"
            label="Butchery"
            locations={locations}
            value={location}
            onChange={onLocationChange}
            className={bigInput}
          />
        </div>
        <div>
          <label htmlFor="breakdown-template" className="mb-1 block text-sm font-medium">
            Template
          </label>
          <Select
            id="breakdown-template"
            value={templateId}
            onChange={(e) => chooseTemplate(e.target.value)}
            className={bigInput}
          >
            <option value="">Choose a template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="breakdown-batch" className="mb-1 block text-sm font-medium">
            Input batch
          </label>
          <Select
            id="breakdown-batch"
            value={batchId}
            onChange={(e) => chooseBatch(e.target.value)}
            className={bigInput}
            disabled={!template}
          >
            <option value="">Choose a batch</option>
            {usable.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_number} · {catchInput ? `${b.quantity} pcs, ` : ''}
                {formatGrams(toGrams(b.weight_kg) ?? 0)} kg · use by {ukDay(b.expiration_date)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {batch && (
        <div className="max-w-xs">
          {catchInput ? (
            <>
              <label htmlFor="breakdown-input-pieces" className="mb-1 block text-sm font-medium">
                Input pieces
              </label>
              <Input
                id="breakdown-input-pieces"
                inputMode="numeric"
                value={inputPieces}
                onChange={(e) => setInputPieces(e.target.value)}
                className={bigInput}
              />
            </>
          ) : (
            <>
              <label htmlFor="breakdown-input-kg" className="mb-1 block text-sm font-medium">
                Input (kg)
              </label>
              <Input
                id="breakdown-input-kg"
                inputMode="decimal"
                value={inputKg}
                onChange={(e) => setInputKg(e.target.value)}
                className={bigInput}
              />
            </>
          )}
        </div>
      )}

      {template && (
        <div className="grid gap-3 sm:grid-cols-2">
          {outputs.map((o) => (
            <div key={o.id} className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor={`out-${o.id}-kg`} className="mb-1 block text-sm font-medium">
                  {label(o)} (kg)
                </label>
                <Input
                  id={`out-${o.id}-kg`}
                  inputMode="decimal"
                  value={rows[o.id]?.kg ?? ''}
                  onChange={(e) => setRow(o.id, 'kg', e.target.value)}
                  className={bigInput}
                />
              </div>
              {catchOutput(o) && (
                <div className="w-24">
                  <label htmlFor={`out-${o.id}-pieces`} className="mb-1 block text-sm font-medium">
                    {label(o)} (pieces)
                  </label>
                  <Input
                    id={`out-${o.id}-pieces`}
                    inputMode="numeric"
                    value={rows[o.id]?.pieces ?? ''}
                    onChange={(e) => setRow(o.id, 'pieces', e.target.value)}
                    className={bigInput}
                  />
                </div>
              )}
              <span className="pb-3 text-xs text-gray-500">exp. {Number(o.expected_percent).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}

      {batch && (
        <div className="rounded-md bg-gray-50 p-3 text-sm">
          <p>
            In {formatGrams(inputGrams)} kg · out {formatGrams(outputGrams)} kg
          </p>
          {lossGrams < 0 ? (
            <p role="alert" className="font-medium text-red-600">
              The outputs weigh {formatGrams(-lossGrams)} kg more than the input.
            </p>
          ) : (
            <p className={Number(percentOf(lossGrams, inputGrams)) > Number(expectedLoss) ? 'text-amber-700' : ''}>
              Loss {formatGrams(lossGrams)} kg ({percentOf(lossGrams, inputGrams)}%) · expected {expectedLoss}%
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="breakdown-loss-reason" className="mb-1 block text-sm font-medium">
          Loss reason
        </label>
        <Input
          id="breakdown-loss-reason"
          value={lossReason}
          onChange={(e) => setLossReason(e.target.value)}
          placeholder="Needed when the loss is over the expected %"
          className={bigInput}
        />
      </div>

      {(problem || error) && (
        <p role="alert" className="text-sm text-red-600">
          {problem || error}
        </p>
      )}
      <Button type="submit" className="h-12 w-full text-base" disabled={submitting}>
        {submitting ? 'Recording…' : 'Record breakdown'}
      </Button>
    </form>
  );
};

export default BreakdownForm;

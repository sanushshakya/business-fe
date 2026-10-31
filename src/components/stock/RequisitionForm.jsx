import React from 'react';
import { Button, Input } from '@/components/ui';
import LineEditor, { checkLines, emptyLine } from './LineEditor';
import LocationSelect from './LocationSelect';

/**
 * A store asking for stock. `onSubmit` gets `{location, note, lines: [{product, quantity}]}`
 * (POST /inventory/requisitions/); if it rejects, what was typed stays.
 */
const RequisitionForm = ({ locations, products, onSubmit, submitting = false }) => {
  const [location, setLocation] = React.useState('');
  const [note, setNote] = React.useState('');
  const [lines, setLines] = React.useState([emptyLine()]);
  const [error, setError] = React.useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (location === '') return setError('Choose the store that needs the stock.');
    const checked = checkLines(lines, products);
    if (checked.error) return setError(checked.error);
    setError(null);
    try {
      await onSubmit({ location, note, lines: checked.lines });
    } catch {
      // the page shows the error; keep what was typed
    }
    return undefined;
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <LocationSelect
        id="requisition-store"
        label="Store"
        locations={locations}
        filter="store"
        value={location}
        onChange={setLocation}
      />
      <LineEditor lines={lines} products={products} onChange={setLines} />
      <Input
        aria-label="Note"
        placeholder="Note (optional)"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Saving…' : 'Raise requisition'}
      </Button>
    </form>
  );
};

export default RequisitionForm;

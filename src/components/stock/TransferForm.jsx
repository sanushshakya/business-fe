import React from 'react';
import { Button, Input } from '@/components/ui';
import LineEditor, { checkLines, emptyLine } from './LineEditor';
import LocationSelect from './LocationSelect';

/**
 * A new draft transfer. `onSubmit` gets `{source_location, destination_location, note, lines: [{product, quantity}]}`
 * (POST /inventory/transfers/); if it rejects, what was typed stays.
 */
const TransferForm = ({ locations, products, onSubmit, submitting = false }) => {
  const [source, setSource] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [note, setNote] = React.useState('');
  const [lines, setLines] = React.useState([emptyLine()]);
  const [error, setError] = React.useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (source === '' || destination === '') return setError('Choose where the stock comes from and goes to.');
    if (source === destination) return setError('Choose a different location to send the stock to.');
    const checked = checkLines(lines, products);
    if (checked.error) return setError(checked.error);
    setError(null);
    try {
      await onSubmit({ source_location: source, destination_location: destination, note, lines: checked.lines });
    } catch {
      // the page shows the error; keep what was typed
    }
    return undefined;
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-2">
        <LocationSelect id="transfer-from" label="From" locations={locations} value={source} onChange={setSource} />
        <LocationSelect
          id="transfer-to"
          label="To"
          locations={locations}
          value={destination}
          onChange={setDestination}
          exclude={source}
        />
      </div>
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
        {submitting ? 'Saving…' : 'Create transfer'}
      </Button>
    </form>
  );
};

export default TransferForm;

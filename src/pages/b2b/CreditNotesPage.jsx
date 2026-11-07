import React from 'react';
import { Button, Card } from '@/components/ui';
import EmptyState from '../../components/EmptyState';
import QueryState from '../../components/QueryState';
import DocumentList from '../../components/b2b/DocumentList';
import useApiList from '../../hooks/useApiList';
import usePagedList from '../../hooks/usePagedList';
import useDocumentActions from './useDocumentActions';

const CREDIT_NOTES = '/wholesale/credit-notes/';

/** Credit notes (G45) and the returns still waiting for one. */
const CreditNotesPage = () => {
  const notes = usePagedList(CREDIT_NOTES, { pageSize: 50 });
  const returns = useApiList('/wholesale/returns/');
  const { post, error, busy, onIssue, onResend, onDelete, onPdf } = useDocumentActions(CREDIT_NOTES);
  const actions = { busy, onIssue, onResend, onDelete, onPdf };
  const waiting = (returns.data ?? []).filter((item) => !item.credit_note);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Credit notes</h2>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {waiting.length > 0 && (
        <Card className="space-y-2 p-4">
          <h3 className="font-medium">Returns without a credit note</h3>
          <ul className="space-y-1 text-sm">
            {waiting.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="font-mono">{item.number_display}</span>
                <span>
                  {item.order_number} · {item.kind === 'door' ? 'refused at the door' : 'returned later'}
                </span>
                <Button
                  variant="secondary"
                  disabled={actions.busy}
                  onClick={() => post(CREDIT_NOTES, { customer_return: item.id })}
                  aria-label={`Draft credit note for ${item.number_display}`}
                >
                  Draft credit note
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <QueryState
        query={{ ...notes, data: notes.data?.results }}
        empty={<EmptyState title="No credit notes" description="Credit notes are drawn up from returns." />}
      >
        {(rows) => <DocumentList documents={rows} kind="credit" {...actions} />}
      </QueryState>
    </section>
  );
};

export default CreditNotesPage;

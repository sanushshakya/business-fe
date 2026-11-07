import React from 'react';
import { Select } from '@/components/ui';
import EmptyState from '../../components/EmptyState';
import QueryState from '../../components/QueryState';
import DocumentList from '../../components/b2b/DocumentList';
import usePagedList from '../../hooks/usePagedList';
import useDocumentActions from './useDocumentActions';

const INVOICES = '/wholesale/invoices/';

/** Trade invoices (G43): issue drafts (numbered, frozen, emailed), rebuild or delete them, resend, open the PDF. */
const InvoicesPage = () => {
  const [status, setStatus] = React.useState('');
  const invoices = usePagedList(INVOICES, { params: status ? { status } : {}, pageSize: 50 });
  const { error, busy, onIssue, onRefresh, onResend, onDelete, onPdf } = useDocumentActions(INVOICES);
  const actions = { busy, onIssue, onRefresh, onResend, onDelete, onPdf };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Invoices</h2>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All</option>
          <option value="draft">Drafts</option>
          <option value="issued">Issued</option>
        </Select>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <QueryState
        query={{ ...invoices, data: invoices.data?.results }}
        empty={<EmptyState title="No invoices" description="Invoices are made from picked orders." />}
      >
        {(rows) => <DocumentList documents={rows} kind="invoice" {...actions} />}
      </QueryState>
    </section>
  );
};

export default InvoicesPage;

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../utils/axios';
import { apiErrorMessage } from '../../utils/http';
import { openPdf } from '../../utils/pdf';

/** The actions shared by invoices and credit notes (G43/G45), against `base` (e.g. `/wholesale/invoices/`). */
export default function useDocumentActions(base) {
  const queryClient = useQueryClient();
  const [error, setError] = React.useState(null);
  const change = useMutation({
    mutationFn: ({ method, path, body = {} }) => (method === 'delete' ? axios.delete(path) : axios.post(path, body)),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['list'] });
    },
    onError: (failure) => setError(apiErrorMessage(failure, 'That did not work.')),
  });
  const act = (method, path) => change.mutateAsync({ method, path }).catch(() => {});
  return {
    error,
    setError,
    busy: change.isLoading,
    onIssue: (doc) => act('post', `${base}${doc.id}/issue/`),
    onRefresh: (doc) => act('post', `${base}${doc.id}/refresh/`),
    onResend: (doc) => act('post', `${base}${doc.id}/email/`),
    onDelete: (doc) => act('delete', `${base}${doc.id}/`),
    onPdf: (doc) =>
      openPdf(`${base}${doc.id}/pdf/`).catch((failure) => setError(apiErrorMessage(failure, 'Could not open it.'))),
    // Through the same mutation, so `busy` covers it (no double submit) and errors clear on success.
    post: (path, body) => change.mutateAsync({ method: 'post', path, body }).catch(() => {}),
  };
}

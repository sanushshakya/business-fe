import React from 'react';
import { Skeleton } from '@/components/ui';

/**
 * Renders loading / error / empty states for a react-query result, otherwise `children(data)`.
 */
const QueryState = ({ query, emptyMessage = 'Nothing to show.', children }) => {
  if (query.isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Could not load data. Please try again.
      </p>
    );
  }
  if (!query.data?.length) return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  return children(query.data);
};

export default QueryState;

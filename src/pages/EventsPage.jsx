import React from 'react';
import { Card } from '@/components/ui';
import QueryState from '../components/QueryState';
import useApiList from '../hooks/useApiList';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '');

const EventsPage = () => {
  const events = useApiList('/demand/events/');

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Cultural events</h2>
      <QueryState query={events} emptyMessage="No events.">
        {(items) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((event) => (
              <Card key={event.id}>
                <h3 className="font-semibold">{event.name}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {formatDate(event.start_date)} – {formatDate(event.end_date)}
                </p>
                {event.description && <p className="mt-2 text-sm">{event.description}</p>}
              </Card>
            ))}
          </div>
        )}
      </QueryState>
    </section>
  );
};

export default EventsPage;

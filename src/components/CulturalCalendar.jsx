import React from 'react';
import { format, parseISO } from 'date-fns';

/**
 * Events grouped under "Month Year" headings, in date order.
 *
 * @param {{id: number|string, name: string, start_date: string}[]} events
 */
const CulturalCalendar = ({ events = [] }) => {
  const sorted = [...events].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const groups = new Map();
  for (const event of sorted) {
    const month = format(parseISO(event.start_date), 'MMMM yyyy');
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(event);
  }

  if (groups.size === 0) return <p className="text-sm text-gray-500">No upcoming events.</p>;

  return (
    <div className="space-y-4">
      {[...groups].map(([month, items]) => (
        <section key={month}>
          <h2 className="mb-2 text-lg font-semibold">{month}</h2>
          <ul className="space-y-1">
            {items.map((event) => (
              <li key={event.id} className="flex gap-3 text-sm text-gray-700">
                <time dateTime={event.start_date}>{format(parseISO(event.start_date), 'd MMM')}</time>
                <span>{event.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default CulturalCalendar;

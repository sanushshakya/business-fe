import React from 'react';

/**
 * The five newest alerts. Each alert: `{id, type, title, created_at?}`.
 */
const RecentAlertsSummary = ({ alerts = [] }) => {
  const recent = [...alerts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">Recent alerts</h2>
      {recent.length === 0 ? (
        <p className="text-sm text-gray-500">No recent alerts.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {recent.map((alert) => (
            <li key={alert.id}>
              <span className="mr-2 font-medium capitalize">{alert.type}</span>
              {alert.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RecentAlertsSummary;

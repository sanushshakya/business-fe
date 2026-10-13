import React from 'react';

/**
 * Banner announcing the next event and how many days remain.
 */
const EventBanner = ({ eventName, daysRemaining }) => (
  <div className="items-center justify-between rounded-lg bg-primary p-4 text-center text-white shadow-md sm:flex">
    <h2 className="text-xl font-bold">{eventName}</h2>
    <p className="mt-2 sm:mt-0">
      {daysRemaining === 0 ? 'Event is today' : `Event in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`}
    </p>
  </div>
);

export default EventBanner;

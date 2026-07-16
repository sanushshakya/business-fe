// src/components/EventTimeline.jsx

import React from 'react';
import { Timeline, TimelineItem, Skeleton } from 'shadcn/ui';

/**
 * EventTimeline component to display an upcoming cultural events timeline for the next 60 days.
 *
 * @returns {React.FC} - The EventTimeline component
 */
const EventTimeline: React.FC = () => {
  const [eventsLoading, setEventsLoading] = React.useState(true);
  const events = [
    {
      date: new Date('2023-10-05T14:00:00'),
      title: 'Cultural Festival',
      description: 'Enjoy traditional music and food.'
    },
    {
      date: new Date('2023-10-12T16:30:00'),
      title: 'Art Exhibition',
      description: 'Discover local artists and their works.'
    },
    // Add more events as needed
  ];

  React.useEffect(() => {
    // Simulate fetching events from an API
    setTimeout(() => {
      setEventsLoading(false);
    }, 1500); // Simulate 1.5s delay for loading
  }, []);

  return (
    <Timeline>
      {eventsLoading ? (
        Array(3).fill(null).map((_, index) => (
          <TimelineItem key={index}>
            <Skeleton className="w-8 h-8" />
            <div>
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-1/2 h-2" />
              <Skeleton className="w-1/3 h-2 mt-1" />
            </div>
          </TimelineItem>
        ))
      ) : (
        events.map((event, index) => (
          <TimelineItem key={index}>
            <Icon name="calendar" size={24} />
            <div>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <small>{event.date.toLocaleDateString()}</small>
            </div>
          </TimelineItem>
        ))
      )}
    </Timeline>
  );
};

export default EventTimeline;
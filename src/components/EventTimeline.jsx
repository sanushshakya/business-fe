// src/components/EventTimeline.jsx

import React from 'react';
import { Timeline, TimelineItem, Icon } from 'shadcn/ui';

/**
 * EventTimeline component to display an upcoming cultural events timeline for the next 60 days.
 *
 * @returns {React.FC} - The EventTimeline component
 */
const EventTimeline: React.FC = () => {
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

  return (
    <Timeline>
      {events.map((event, index) => (
        <TimelineItem key={index}>
          <Icon name="calendar" size={24} />
          <div>
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <small>{event.date.toLocaleDateString()}</small>
          </div>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default EventTimeline;
```

This component uses the `shadcn/ui` library to create a timeline with events. Each event is represented as a `TimelineItem`, which includes an icon, title, description, and date. The events are hardcoded for simplicity, but in a real-world scenario, you might fetch these from an API or use a context to manage them globally.
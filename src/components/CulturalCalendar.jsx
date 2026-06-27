import React from 'react';
import { format } from 'date-fns';
import { List, ListItem, ListItemText } from '@mui/material';

/**
 * CulturalCalendar component to display a 3-month forward view as a styled list grouped by month.
 *
 * @component
 * @returns {ReactElement} The rendered CulturalCalendar component.
 */
const CulturalCalendar = () => {
  // Sample data: Replace this with actual fetched data
  const events = [
    { date: new Date('2023-10-01'), title: 'Event A' },
    { date: new Date('2023-10-15'), title: 'Event B' },
    { date: new Date('2023-11-01'), title: 'Event C' },
    { date: new Date('2023-12-20'), title: 'Event D' },
    { date: new Date('2024-01-10'), title: 'Event E' },
    { date: new Date('2024-02-05'), title: 'Event F' },
  ];

  // Group events by month
  const groupEventsByMonth = (events) => {
    const groupedEvents = {};
    events.forEach(event => {
      const monthYear = format(event.date, 'MMMM yyyy');
      if (!groupedEvents[monthYear]) {
        groupedEvents[monthYear] = [];
      }
      groupedEvents[monthYear].push(event);
    });
    return groupedEvents;
  };

  const groupedEvents = groupEventsByMonth(events);

  return (
    <List>
      {Object.keys(groupedEvents).map((monthYear, index) => (
        <React.Fragment key={index}>
          <h2>{monthYear}</h2>
          <List dense disablePadding>
            {groupedEvents[monthYear].map((event, eventIndex) => (
              <ListItem key={eventIndex} button>
                <ListItemText primary={event.title} secondary={`Date: ${format(event.date, 'dd MMMM yyyy')}`} />
              </ListItem>
            ))}
          </List>
        </React.Fragment>
      ))}
    </List>
  );
};

export default CulturalCalendar;
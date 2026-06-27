import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { List, ListItem, ListItemText } from '@mui/material';

/**
 * CulturalCalendar component to display a 3-month forward view as a styled list grouped by month.
 *
 * @component
 * @returns {ReactElement} The rendered CulturalCalendar component.
 */
const CulturalCalendar = () => {
  const [events, setEvents] = useState([]);

  // Fetch events from the API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('https://api.example.com/events');
        setEvents(response.data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };

    fetchEvents();
  }, []);

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

  // Get the current date and calculate the end date for 3 months forward
  const currentDate = new Date();
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, currentDate.getDate());

  // Filter events within the next 3 months
  const futureEvents = Object.keys(groupedEvents).reduce((acc, monthYear) => {
    groupedEvents[monthYear].forEach(event => {
      if (event.date >= currentDate && event.date <= endDate) {
        acc.push(event);
      }
    });
    return acc;
  }, []);

  // Group filtered events by month
  const futureGroupedEvents = groupEventsByMonth(futureEvents);

  return (
    <List>
      {Object.keys(futureGroupedEvents).map((monthYear, index) => (
        <React.Fragment key={index}>
          <h2>{monthYear}</h2>
          <List dense disablePadding>
            {futureGroupedEvents[monthYear].map((event, eventIndex) => (
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
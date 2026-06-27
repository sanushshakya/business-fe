import React from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import EventDates from './EventDates'; // Import the new EventDates component

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
    <div>
      <EventDates dates={futureEvents} /> {/* Use the new EventDates component */}
      {Object.keys(futureGroupedEvents).map((monthYear, index) => (
        <React.Fragment key={index}>
          <h2>{monthYear}</h2>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {futureGroupedEvents[monthYear].map((event, eventIndex) => (
              <li key={eventIndex}>{event.title}</li> // Display event titles
            ))}
          </ul>
        </React.Fragment>
      ))}
    </div>
  );
};

export default CulturalCalendar;
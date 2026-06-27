import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CulturalCalendar from '../CulturalCalendar';

describe('CulturalCalendar Component', () => {
  // Mock data for testing
  const events = [
    { id: 1, title: 'Event 1', date: '2023-10-05' },
    { id: 2, title: 'Event 2', date: '2023-10-12' },
    { id: 3, title: 'Event 3', date: '2023-11-18' },
    { id: 4, title: 'Event 4', date: '2023-12-05' },
  ];

  // Test rendering the CulturalCalendar component
  it('renders the cultural calendar with events grouped by month', () => {
    render(<CulturalCalendar events={events} />);

    // Check if the calendar months are displayed
    expect(screen.getByText('October')).toBeInTheDocument();
    expect(screen.getByText('November')).toBeInTheDocument();
    expect(screen.getByText('December')).toBeInTheDocument();

    // Check if the events are displayed in their respective months
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
    expect(screen.getByText('Event 3')).toBeInTheDocument();
    expect(screen.getByText('Event 4')).toBeInTheDocument();
  });

  // Test adding a new event
  it('adds a new event to the calendar', () => {
    render(<CulturalCalendar events={events} />);

    const addEventButton = screen.getByText('Add Event');
    fireEvent.click(addEventButton);

    // Assuming there is an input field for the event title and date
    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'New Event' } });

    const dateInput = screen.getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: '2024-01-01' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Check if the new event is added to the calendar
    expect(screen.getByText('New Event')).toBeInTheDocument();
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });
});
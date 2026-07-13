// src/components/Feature.test.jsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Feature from '../Feature';
import useTeamData from '../../hooks/useTeamData';

// Mock the useTeamData hook to return predefined data
jest.mock('../../hooks/useTeamData', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Feature Component', () => {
  let mockUseTeamData = null;

  beforeEach(() => {
    // Initialize the mock function with an empty array
    mockUseTeamData = jest.fn();
    useTeamData.mockImplementation(mockUseTeamData);
  });

  afterEach(() => {
    // Reset all mocks to their initial state
    jest.clearAllMocks();
  });

  it('renders the component without crashing', () => {
    // Call the mock function with an empty array
    mockUseTeamData.mockReturnValue({ users: [] });
    render(<Feature />);
    // Check if the component renders without throwing an error
    expect(screen.getByText(/pending invitations/i)).toBeInTheDocument();
  });

  it('displays a list of pending invitations', async () => {
    // Define the data to be returned by the mock function
    const users = [
      { id: 1, email: 'user1@example.com' },
      { id: 2, email: 'user2@example.com' },
    ];
    // Call the mock function with the defined data
    mockUseTeamData.mockReturnValue({ users });
    render(<Feature />);
    // Wait for the component to update and check if the emails are displayed
    await waitFor(() => {
      expect(screen.getByText(users[0].email)).toBeInTheDocument();
      expect(screen.getByText(users[1].email)).toBeInTheDocument();
    });
  });

  it('resends an invitation when Resend button is clicked', async () => {
    // Define the data to be returned by the mock function
    const users = [{ id: 1, email: 'user1@example.com' }];
    // Call the mock function with the defined data
    mockUseTeamData.mockReturnValue({ users });
    render(<Feature />);
    // Wait for the component to update and click the Resend button
    await waitFor(() => {
      fireEvent.click(screen.getByText('Resend'));
    });
    // Check if the resend action is called with the correct user ID
    expect(mockUseTeamData).toHaveBeenCalledWith({
      ...users[0],
      action: 'resend',
    });
  });

  it('cancels an invitation when Cancel button is clicked', async () => {
    // Define the data to be returned by the mock function
    const users = [{ id: 1, email: 'user1@example.com' }];
    // Call the mock function with the defined data
    mockUseTeamData.mockReturnValue({ users });
    render(<Feature />);
    // Wait for the component to update and click the Cancel button
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    // Check if the cancel action is called with the correct user ID
    expect(mockUseTeamData).toHaveBeenCalledWith({
      ...users[0],
      action: 'cancel',
    });
  });
});
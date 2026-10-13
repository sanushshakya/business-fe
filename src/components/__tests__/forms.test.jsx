import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import BranchForm from '../BranchForm';
import CompanyProfileForm from '../CompanyProfileForm';
import InviteUserForm from '../InviteUserForm';
import ResetPassword from '../ResetPassword';
import StockReceiptModal from '../StockReceiptModal';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => vi.clearAllMocks());

describe('BranchForm', () => {
  it('submits trimmed values and clears the form', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<BranchForm onSubmit={onSubmit} />);
    type('Branch name', '  High St ');
    type('Address', '1 High St');
    fireEvent.click(screen.getByRole('button', { name: 'Add branch' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'High St', address: '1 High St' }));
    await waitFor(() => expect(screen.getByLabelText('Branch name')).toHaveValue(''));
  });
});

describe('InviteUserForm', () => {
  it('sends the payload the invitations endpoint expects', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<InviteUserForm onSubmit={onSubmit} />);
    type('Email', 'new@example.com');
    type('Role', 'Staff');
    fireEvent.click(screen.getByRole('button', { name: 'Invite user' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ invited_email: 'new@example.com', role: 'Staff' }));
  });
});

describe('CompanyProfileForm', () => {
  const company = { id: 1, name: 'M18 Foods', registration_number: '123', address: 'Old' };

  it('prefills, locks the registration number and submits edits', () => {
    const onSubmit = vi.fn();
    render(<CompanyProfileForm company={company} onSubmit={onSubmit} />);
    expect(screen.getByLabelText('Registration number')).toBeDisabled();
    type('Address', 'New');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'M18 Foods', address: 'New' });
  });
});

describe('ResetPassword', () => {
  const setup = () => render(<ResetPassword uidb64="abc" token="tok" onDone={vi.fn()} />);

  it('rejects mismatched passwords without calling the API', () => {
    setup();
    type('New password', 'longenough1');
    type('Confirm new password', 'different1');
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('posts the fields the backend expects and confirms success', async () => {
    axios.post.mockResolvedValue({});
    setup();
    type('New password', 'longenough1');
    type('Confirm new password', 'longenough1');
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await screen.findByRole('status');
    expect(axios.post).toHaveBeenCalledWith('/auth/password_reset/confirm/', {
      uidb64: 'abc',
      token: 'tok',
      new_password1: 'longenough1',
      new_password2: 'longenough1',
    });
  });

  it('explains an invalid link', async () => {
    axios.post.mockRejectedValue({ response: { status: 400 } });
    setup();
    type('New password', 'longenough1');
    type('Confirm new password', 'longenough1');
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid');
  });
});

describe('StockReceiptModal', () => {
  const renderModal = (props) =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <StockReceiptModal isOpen onClose={vi.fn()} {...props} />
      </QueryClientProvider>
    );

  beforeEach(() => axios.get.mockResolvedValue({ data: { results: [{ id: 4, name: 'Dates' }], next: null } }));

  it('renders nothing when closed', () => {
    renderModal({ isOpen: false, onSubmit: vi.fn() });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('requires every field', async () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Batch number is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the batch payload', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    renderModal({ onSubmit });
    await screen.findByRole('option', { name: 'Dates' });
    fireEvent.change(screen.getByLabelText('Product'), { target: { value: '4' } });
    type('Batch number', 'B-1');
    type('Quantity', '12');
    type('Expiration date', '2027-01-31');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        product: 4,
        batch_number: 'B-1',
        quantity: 12,
        expiration_date: '2027-01-31',
      })
    );
  });
});

describe('forms keep their values when saving fails', () => {
  it('BranchForm', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('403'));
    render(<BranchForm onSubmit={onSubmit} />);
    type('Branch name', 'High St');
    type('Address', '1 High St');
    fireEvent.click(screen.getByRole('button', { name: 'Add branch' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByLabelText('Branch name')).toHaveValue('High St');
  });

  it('InviteUserForm', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('403'));
    render(<InviteUserForm onSubmit={onSubmit} />);
    type('Email', 'a@b.co');
    type('Role', 'Staff');
    fireEvent.click(screen.getByRole('button', { name: 'Invite user' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByLabelText('Email')).toHaveValue('a@b.co');
  });
});

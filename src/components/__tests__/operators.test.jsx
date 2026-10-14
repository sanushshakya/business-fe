import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import useAuthStore from '../../stores/authStore';
import CodePad from '../CodePad';
import LoginForm from '../LoginForm';
import MainLayout from '../MainLayout';
import OperatorsPanel from '../OperatorsPanel';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('../../offline/OfflineProvider', () => ({
  useOffline: () => ({ isOnline: true, isSyncing: false, pending: 0, failed: 0, retryFailed: () => {} }),
}));

const typeCode = (digits) => fireEvent.change(screen.getByLabelText(/8-digit code/i), { target: { value: digits } });
const wrap = (ui, client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) => (
  <QueryClientProvider client={client}>{ui}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useAuthStore.getState().clearTokens();
});

describe('CodePad', () => {
  it('submits as soon as the eighth digit is in, from the keyboard', () => {
    const onSubmit = vi.fn();
    render(<CodePad onSubmit={onSubmit} />);
    typeCode('1234567');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('7 of 8 digits')).toBeInTheDocument();
    typeCode('12345678');
    expect(onSubmit).toHaveBeenCalledWith('12345678');
  });

  it('works from the on-screen keypad, with delete and clear, and ignores non-digits', () => {
    const onSubmit = vi.fn();
    render(<CodePad onSubmit={onSubmit} />);
    for (const digit of '1234') fireEvent.click(screen.getByRole('button', { name: digit }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete last digit' }));
    expect(screen.getByText('3 of 8 digits')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('0 of 8 digits')).toBeInTheDocument();
    typeCode('12ab34');
    expect(screen.getByText('4 of 8 digits')).toBeInTheDocument();
    for (const digit of '5678') fireEvent.click(screen.getByRole('button', { name: digit }));
    expect(onSubmit).toHaveBeenCalledWith('12345678');
  });

  it('clears the field after a refused code and shows why', () => {
    const { rerender } = render(<CodePad onSubmit={() => {}} />);
    typeCode('1234');
    rerender(<CodePad onSubmit={() => {}} error="That code was not recognised." />);
    expect(screen.getByRole('alert')).toHaveTextContent('not recognised');
    expect(screen.getByText('0 of 8 digits')).toBeInTheDocument();
  });
});

describe('LoginForm operator code', () => {
  const renderLogin = () =>
    render(
      wrap(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/dashboard" element={<div>The dashboard</div>} />
          </Routes>
        </MemoryRouter>
      )
    );

  it('signs an operator in with the code', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'a', refresh_token: 'r' } });
    renderLogin();
    fireEvent.click(screen.getByRole('tab', { name: 'Operator code' }));
    typeCode('12345678');
    await screen.findByText('The dashboard');
    expect(axios.post).toHaveBeenCalledWith('/auth/code-login/', { code: '12345678' });
    expect(useAuthStore.getState().accessToken).toBe('a');
  });

  it.each([
    [400, 'That code was not recognised.'],
    [429, 'Too many attempts. Wait a minute and try again.'],
    [500, 'Could not reach the server. Please try again.'],
  ])('explains a %i', async (status, message) => {
    axios.post.mockRejectedValue({ response: { status } });
    renderLogin();
    fireEvent.click(screen.getByRole('tab', { name: 'Operator code' }));
    typeCode('12345678');
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('keeps email sign-in on the other tab', () => {
    renderLogin();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Operator code' }));
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Email' }));
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});

describe('MainLayout for operators', () => {
  const me = (role, role_label) => ({ data: { id: 5, name: 'Amy', role, role_label, is_staff: false } });
  const renderLayout = (path) =>
    render(
      wrap(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/dashboard" element={<MainLayout />}>
              <Route index element={<div>Stock alerts page</div>} />
              <Route path="pos" element={<div>Till page</div>} />
              <Route path="sales" element={<div>Sales page</div>} />
              <Route path="team" element={<div>Team page</div>} />
              <Route path="inventory" element={<div>Inventory page</div>} />
              <Route path="pov/demand" element={<div>Demand overview page</div>} />
              <Route path="pov/freight" element={<div>Freight overview page</div>} />
              <Route path="freight" element={<div>Freight alerts page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )
    );
  const links = () => screen.getAllByRole('link').map((a) => a.textContent);

  it('shows a till operator only the till and sales, and sends them back from anywhere else', async () => {
    axios.get.mockResolvedValue(me('till', 'Till operator'));
    renderLayout('/dashboard/team');
    await screen.findByText('Till page');
    expect(screen.queryByText('Team page')).not.toBeInTheDocument();
    expect(links()).toEqual(['Till', 'Sales']);
    expect(screen.getByText('Amy · Till operator')).toBeInTheDocument();
  });

  it('gives each role its own screens and landing page', async () => {
    axios.get.mockResolvedValue(me('freight', 'Freight manager'));
    renderLayout('/dashboard');
    await screen.findByText('Freight overview page');
    expect(links()).toEqual(['Freight overview', 'Freight']);
    expect(screen.queryByText('Inventory page')).not.toBeInTheDocument();
  });

  it('lets a role open the screens in its own area', async () => {
    axios.get.mockResolvedValue(me('freight', 'Freight manager'));
    renderLayout('/dashboard/freight');
    expect(await screen.findByText('Freight alerts page')).toBeInTheDocument();
  });

  it('keeps a stock controller on the stock alerts and inventory', async () => {
    axios.get.mockResolvedValue(me('stock', 'Stock controller'));
    renderLayout('/dashboard');
    expect(await screen.findByText('Stock alerts page')).toBeInTheDocument();
    expect(links()).toEqual(['Stock Alerts', 'Inventory', 'Waste']);
  });

  it('leaves every screen open to regular users, including the till and the overviews', async () => {
    axios.get.mockResolvedValue({ data: { id: 1, name: 'owner@x.test', role: '', is_staff: true } });
    renderLayout('/dashboard/team');
    expect(await screen.findByText('Team page')).toBeInTheDocument();
    expect(links()).toEqual(
      expect.arrayContaining([
        'Till',
        'Sales',
        'Demand overview',
        'Freight overview',
        'Supplier overview',
        'Freight',
        'Demand',
        'Suppliers',
        'Team',
      ])
    );
  });

  it('falls back to the full app if the profile cannot be loaded (the server still enforces access)', async () => {
    axios.get.mockRejectedValue(new Error('offline'));
    renderLayout('/dashboard/team');
    expect(await screen.findByText('Team page')).toBeInTheDocument();
  });
});

describe('OperatorsPanel', () => {
  const users = [
    { id: 1, name: 'Amy', role: 'till', is_active: true, last_login: null },
    { id: 2, name: 'Ben', role: 'freight', is_active: false, last_login: '2026-10-14T09:00:00Z' },
  ];
  const noop = { onCreate: vi.fn(), onResetCode: vi.fn(), onToggleActive: vi.fn(), onChangeRole: vi.fn() };

  it('creates an operator with a role and clears the name once saved', async () => {
    const onCreate = vi.fn().mockResolvedValue();
    render(<OperatorsPanel users={[]} {...noop} onCreate={onCreate} />);
    expect(screen.getByRole('button', { name: 'Add operator' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Operator name'), { target: { value: ' Dee ' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'demand' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add operator' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ name: 'Dee', role: 'demand' }));
    await waitFor(() => expect(screen.getByLabelText('Operator name')).toHaveValue(''));
  });

  it('offers every role', () => {
    render(<OperatorsPanel users={[]} {...noop} />);
    expect([...screen.getByLabelText('Role').options].map((o) => o.textContent)).toEqual([
      'Till operator',
      'Demand planner',
      'Freight manager',
      'Supplier manager',
      'Stock controller',
    ]);
  });

  it('keeps the name when creating fails', async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error('403'));
    render(<OperatorsPanel users={[]} {...noop} onCreate={onCreate} />);
    fireEvent.change(screen.getByLabelText('Operator name'), { target: { value: 'Amy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add operator' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(screen.getByLabelText('Operator name')).toHaveValue('Amy');
  });

  it('shows the issued code once and says it cannot be shown again', () => {
    const onDismissCode = vi.fn();
    render(
      <OperatorsPanel
        users={users}
        {...noop}
        issued={{ name: 'Amy', code: '04839215', reset: true }}
        onDismissCode={onDismissCode}
      />
    );
    expect(screen.getByTestId('issued-code')).toHaveTextContent('04839215');
    expect(screen.getByText(/cannot be shown again; the old code no longer works/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'I have noted it' }));
    expect(onDismissCode).toHaveBeenCalled();
  });

  it('changes a role, asks before resetting a code and toggles active state', async () => {
    const onResetCode = vi.fn().mockResolvedValue();
    const onToggleActive = vi.fn();
    const onChangeRole = vi.fn();
    render(
      <OperatorsPanel
        users={users}
        {...noop}
        onResetCode={onResetCode}
        onToggleActive={onToggleActive}
        onChangeRole={onChangeRole}
      />
    );
    expect(screen.getByText('Never')).toBeInTheDocument();
    expect(screen.getByLabelText('Role for Ben')).toHaveValue('freight');
    fireEvent.change(screen.getByLabelText('Role for Amy'), { target: { value: 'supplier' } });
    expect(onChangeRole).toHaveBeenCalledWith(users[0], 'supplier');

    fireEvent.click(screen.getByRole('button', { name: 'Reset code for Amy' }));
    expect(onResetCode).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset code for Amy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm new code for Amy' }));
    await waitFor(() => expect(onResetCode).toHaveBeenCalledWith(users[0]));

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Amy' }));
    expect(onToggleActive).toHaveBeenCalledWith(users[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Activate Ben' }));
    expect(onToggleActive).toHaveBeenCalledWith(users[1]);
  });
});

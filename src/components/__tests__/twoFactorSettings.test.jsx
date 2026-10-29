import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StaffTwoFactorList from '../StaffTwoFactorList';
import TwoFactorPanel from '../TwoFactorPanel';

const ENROLMENT = { secret: 'JBSWY3DPEHPK3PXP', otpauth_uri: 'otpauth://totp/x', qr_svg: '<svg></svg>' };
const CODES = Array.from({ length: 10 }, (_, i) => `aaaa${i}-bbbbb`);

describe('TwoFactorPanel', () => {
  it('shows Off and sets it up: QR, confirm code, recovery codes', async () => {
    const start = vi.fn().mockResolvedValue(ENROLMENT);
    const confirm = vi.fn().mockResolvedValue(CODES);
    const onChanged = vi.fn();
    render(
      <TwoFactorPanel
        status={{ enabled: false, required: false, recovery_codes_left: 0 }}
        start={start}
        confirm={confirm}
        disable={vi.fn()}
        onChanged={onChanged}
      />
    );
    expect(screen.getByText('Off')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Set up two-factor sign-in' }));
    await screen.findByRole('img', { name: 'QR code for your authenticator app' });
    fireEvent.change(screen.getByLabelText('6-digit code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }));
    await screen.findByText(CODES[9]);
    expect(confirm).toHaveBeenCalledWith('123456');
    fireEvent.click(screen.getByRole('button', { name: "I've saved these codes" }));
    expect(onChanged).toHaveBeenCalled();
  });

  it('shows On with codes left, and turns it off with a code', async () => {
    const disable = vi.fn().mockResolvedValue();
    const onChanged = vi.fn();
    render(
      <TwoFactorPanel
        status={{ enabled: true, required: false, recovery_codes_left: 7 }}
        start={vi.fn()}
        confirm={vi.fn()}
        disable={disable}
        onChanged={onChanged}
      />
    );
    expect(screen.getByText('On')).toBeInTheDocument();
    expect(screen.getByText('7 recovery codes left')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }));
    fireEvent.change(screen.getByLabelText('6-digit code'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm turn off' }));
    await vi.waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(disable).toHaveBeenCalledWith('654321');
  });

  it('does not offer turning it off when it is required', () => {
    render(
      <TwoFactorPanel
        status={{ enabled: true, required: true, recovery_codes_left: 10 }}
        start={vi.fn()}
        confirm={vi.fn()}
        disable={vi.fn()}
        onChanged={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: 'Turn off' })).not.toBeInTheDocument();
    expect(screen.getByText(/Admins must keep/)).toBeInTheDocument();
  });

  it('shows a wrong code and keeps the form', async () => {
    const confirm = vi
      .fn()
      .mockRejectedValue({ response: { status: 400, data: { detail: 'That code is not right.' } } });
    render(
      <TwoFactorPanel
        status={{ enabled: false, required: false, recovery_codes_left: 0 }}
        start={vi.fn().mockResolvedValue(ENROLMENT)}
        confirm={confirm}
        disable={vi.fn()}
        onChanged={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Set up two-factor sign-in' }));
    fireEvent.change(await screen.findByLabelText('6-digit code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('That code is not right.');
    expect(screen.getByLabelText('6-digit code')).toBeInTheDocument();
  });
});

describe('StaffTwoFactorList', () => {
  const users = [
    { id: 1, email: 'boss@example.com', name: 'Boss', is_staff: true, two_factor_enabled: true },
    { id: 2, email: 'clerk@example.com', name: '', is_staff: false, two_factor_enabled: true },
    { id: 3, email: 'new@example.com', name: '', is_staff: false, two_factor_enabled: false },
  ];

  it('shows each person and whether two-factor is on', () => {
    render(<StaffTwoFactorList users={users} currentUserId={1} onReset={vi.fn()} />);
    expect(screen.getByText('boss@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('On')).toHaveLength(2);
    expect(screen.getByText('Off')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('needs a second click before resetting, and never offers it for yourself or when off', () => {
    const onReset = vi.fn();
    render(<StaffTwoFactorList users={users} currentUserId={1} onReset={onReset} />);
    const buttons = screen.getAllByRole('button', { name: 'Reset 2FA' });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    expect(onReset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reset' }));
    expect(onReset).toHaveBeenCalledWith(users[1]);
  });

  it('can cancel a reset', () => {
    const onReset = vi.fn();
    render(<StaffTwoFactorList users={users} currentUserId={1} onReset={onReset} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset 2FA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: 'Confirm reset' })).not.toBeInTheDocument();
    expect(onReset).not.toHaveBeenCalled();
  });
});

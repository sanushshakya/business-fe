import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HmrcPanel from '../HmrcPanel';

const OPEN = { periodKey: '26C3', start: '2026-07-01', end: '2026-09-30', due: '2026-11-07', status: 'O' };
const CONNECTED = { environment: 'sandbox', connected: true, vrn: '123456789', connected_at: '2026-11-16T09:00:00Z' };

const panel = (props = {}) =>
  render(
    <HmrcPanel
      status={CONNECTED}
      obligations={[OPEN]}
      submissions={[]}
      isStaff
      onConnect={vi.fn()}
      onDisconnect={vi.fn()}
      onPick={vi.fn()}
      onSubmit={vi.fn()}
      onCheck={vi.fn()}
      onResolve={vi.fn()}
      period={{ start: '2026-07-01', end: '2026-09-30' }}
      {...props}
    />
  );

describe('HmrcPanel', () => {
  it('offers to connect when not connected', () => {
    const onConnect = vi.fn();
    panel({ status: { ...CONNECTED, connected: false, vrn: null }, obligations: [], onConnect });
    fireEvent.click(screen.getByRole('button', { name: 'Connect to HMRC' }));
    expect(onConnect).toHaveBeenCalled();
  });

  it('shows the VRN and the environment once connected', () => {
    panel();
    expect(screen.getByText(/VRN 123456789/)).toBeTruthy();
    expect(screen.getByText(/sandbox/)).toBeTruthy();
  });

  it('picks an open obligation and fills the period', () => {
    const onPick = vi.fn();
    panel({ onPick });
    fireEvent.click(screen.getByRole('button', { name: /1 Jul 2026 to 30 Sep 2026/ }));
    expect(onPick).toHaveBeenCalledWith('2026-07-01', '2026-09-30');
    expect(screen.getByText(/due 7 Nov 2026/)).toBeTruthy();
  });

  it('submits only with the declaration ticked and a second click', () => {
    const onSubmit = vi.fn();
    panel({ onSubmit });
    fireEvent.click(screen.getByRole('button', { name: /1 Jul 2026 to 30 Sep 2026/ }));
    const submit = screen.getByRole('button', { name: 'Submit to HMRC' });
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: /true and complete/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit to HMRC' }));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Yes, submit to HMRC/ }));
    expect(onSubmit).toHaveBeenCalledWith('26C3', '2026-07-01', '2026-09-30');
  });

  it('shows the receipt of an accepted submission', () => {
    const accepted = {
      id: 4,
      period_key: '26C3',
      status: 'accepted',
      form_bundle_number: '256660290587',
      processing_date: '2026-11-16T09:30:47Z',
      charge_ref_number: 'XM002610011594',
      submitted_at: '2026-11-16T09:30:40Z',
    };
    panel({ submissions: [accepted] });
    expect(screen.getByText(/Form bundle 256660290587/)).toBeTruthy();
    expect(screen.getByText(/XM002610011594/)).toBeTruthy();
  });

  it('asks to check an unknown submission with HMRC', () => {
    const onCheck = vi.fn();
    const unknown = {
      id: 5,
      period_key: '26C3',
      status: 'unknown',
      error_code: 'NO_ANSWER',
      submitted_at: '2026-11-16T09:30:40Z',
    };
    panel({ submissions: [unknown], onCheck });
    fireEvent.click(screen.getByRole('button', { name: 'Check with HMRC' }));
    expect(onCheck).toHaveBeenCalledWith(5);
  });

  it("shows HMRC's message when it refused", () => {
    panel({ error: 'Amount not valid' });
    expect(screen.getByRole('alert').textContent).toMatch(/Amount not valid/);
  });

  it('lets only staff connect and submit', () => {
    panel({ isStaff: false });
    expect(screen.queryByRole('button', { name: 'Submit to HMRC' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Disconnect' })).toBeNull();
  });

  it('forgets the picked period when the dates are changed by hand', () => {
    const { rerender } = panel();
    fireEvent.click(screen.getByRole('button', { name: /1 Jul 2026 to 30 Sep 2026/ }));
    expect(screen.getByRole('button', { name: 'Submit to HMRC' })).toBeTruthy();
    rerender(
      <HmrcPanel
        status={CONNECTED}
        obligations={[OPEN]}
        submissions={[]}
        isStaff
        onConnect={vi.fn()}
        onDisconnect={vi.fn()}
        onPick={vi.fn()}
        onSubmit={vi.fn()}
        onCheck={vi.fn()}
        onResolve={vi.fn()}
        period={{ start: '2026-07-01', end: '2026-08-31' }}
      />
    );
    expect(screen.queryByRole('button', { name: 'Submit to HMRC' })).toBeNull();
  });

  it('resolves an attempt HMRC holds with other figures, with a reason', () => {
    const onResolve = vi.fn();
    const differs = {
      id: 7,
      period_key: '26C3',
      status: 'unknown',
      error_code: 'FIGURES_DIFFER',
      error_message: 'HMRC holds a return for this period with other figures.',
      submitted_at: '2026-11-16T09:30:40Z',
    };
    panel({ submissions: [differs], onResolve });
    const record = screen.getByRole('button', { name: "Record HMRC's figures" });
    expect(record.disabled).toBe(true);
    fireEvent.change(screen.getByRole('textbox', { name: /Reason/ }), {
      target: { value: 'Old attempt reached HMRC' },
    });
    fireEvent.click(screen.getByRole('button', { name: "Record HMRC's figures" }));
    expect(onResolve).toHaveBeenCalledWith(7, 'record_hmrc', 'Old attempt reached HMRC');
    fireEvent.click(screen.getByRole('button', { name: 'Close this attempt' }));
    expect(onResolve).toHaveBeenCalledWith(7, 'close', 'Old attempt reached HMRC');
  });
});

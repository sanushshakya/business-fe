import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OfflineBanner from '../OfflineBanner';

const at = (iso) => new Date(iso).getTime();

describe('OfflineBanner (G29)', () => {
  it('shows nothing when online with nothing waiting', () => {
    const { container } = render(<OfflineBanner online waiting={0} failed={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('says since when the till is offline and how many sales wait', () => {
    render(<OfflineBanner online={false} since={at('2026-11-05T09:30:00Z')} waiting={3} failed={0} />);
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent(/Offline since \d\d:30/);
    expect(banner).toHaveTextContent('3 sales waiting to send');
    expect(banner).toHaveTextContent('Sales are kept on this till and sent when it reconnects.');
  });

  it('says one sale in the singular, and has no since before the first refresh', () => {
    render(<OfflineBanner online={false} since={null} waiting={1} failed={0} />);
    expect(screen.getByRole('status')).toHaveTextContent('Offline · 1 sale waiting to send');
  });

  it('shows progress while sending', () => {
    render(<OfflineBanner online waiting={4} failed={0} sending />);
    expect(screen.getByRole('status')).toHaveTextContent('Sending 4 offline sales…');
  });

  it('shows what is still waiting once back online', () => {
    render(<OfflineBanner online waiting={2} failed={0} />);
    expect(screen.getByRole('status')).toHaveTextContent('Back online · 2 offline sales waiting to send');
  });

  it('offers Retry when sales could not be sent', () => {
    const onRetry = vi.fn();
    render(<OfflineBanner online waiting={0} failed={2} onRetry={onRetry} />);
    expect(screen.getByRole('status')).toHaveTextContent('2 offline sales could not be sent');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('adds the card note when the server, not the browser, is unreachable', () => {
    render(<OfflineBanner online={false} serverOnly since={null} waiting={0} failed={0} />);
    expect(screen.getByRole('status')).toHaveTextContent("for a card sale, enter the terminal's auth code");
  });
});

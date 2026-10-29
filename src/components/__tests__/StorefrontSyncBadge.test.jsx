import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StorefrontSyncBadge from '../StorefrontSyncBadge';

const status = (extra) => ({
  type: 'sync.status',
  state: 'green',
  last_push_at: '2026-10-29T10:00:00+00:00',
  backlog: 0,
  failed: 0,
  last_error: '',
  ...extra,
});

describe('StorefrontSyncBadge', () => {
  it('shows nothing before the first status or without a shop connection', () => {
    const { container, rerender } = render(<StorefrontSyncBadge status={null} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<StorefrontSyncBadge status={status({ state: 'off' })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('is green when the shop is in sync, with the last push on hover', () => {
    render(<StorefrontSyncBadge status={status()} />);
    const badge = screen.getByText('Shop in sync');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge.title).toMatch(/Last stock push/);
  });

  it('is amber while updates wait to be sent', () => {
    render(<StorefrontSyncBadge status={status({ state: 'amber', backlog: 3 })} />);
    expect(screen.getByText('Shop: 3 waiting')).toHaveClass('bg-yellow-100');
  });

  it('is red when sending fails, with the error on hover', () => {
    render(<StorefrontSyncBadge status={status({ state: 'red', failed: 1, last_error: 'HTTP 502' })} />);
    const badge = screen.getByText('Shop sync failing');
    expect(badge).toHaveClass('bg-red-100');
    expect(badge.title).toMatch(/HTTP 502/);
    expect(badge.title).toMatch(/1 failed/);
  });

  it('says when the live status is lost', () => {
    render(<StorefrontSyncBadge status={status()} disconnected />);
    expect(screen.getByText('Shop status offline')).toHaveClass('bg-gray-100');
  });
});

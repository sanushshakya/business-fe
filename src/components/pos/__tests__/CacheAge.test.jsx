import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CacheAge from '../CacheAge';

const at = (iso) => new Date(iso).getTime();

describe('CacheAge', () => {
  it('says when prices were last updated', () => {
    render(<CacheAge refreshedAt={at('2026-11-04T12:04:00Z')} now={at('2026-11-04T12:10:00Z')} />);
    expect(screen.getByRole('status')).toHaveTextContent(/^Prices updated \d\d:04$/);
  });

  it('turns amber after the warning hours', () => {
    render(<CacheAge refreshedAt={at('2026-11-04T08:00:00Z')} warnHours={2} now={at('2026-11-04T10:01:00Z')} />);
    expect(screen.getByRole('status')).toHaveTextContent('may be out of date');
    expect(screen.getByRole('status')).toHaveClass('text-amber-700');
  });

  it('says when the server cannot be reached', () => {
    render(<CacheAge refreshedAt={at('2026-11-04T12:04:00Z')} failing now={at('2026-11-04T12:05:00Z')} />);
    expect(screen.getByRole('status')).toHaveTextContent('server not reachable, using this copy');
  });

  it('shows nothing before the first load', () => {
    const { container } = render(<CacheAge refreshedAt={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

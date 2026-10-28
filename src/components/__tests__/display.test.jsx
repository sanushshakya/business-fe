import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AlertCard from '../AlertCard';
import AlternativeSupplierCarousel from '../AlternativeSupplierCarousel';
import BranchList from '../BranchList';
import CulturalCalendar from '../CulturalCalendar';
import EmptyState from '../EmptyState';
import ErrorBoundary from '../ErrorBoundary';
import EventBanner from '../EventBanner';
import FreightAlert from '../FreightAlert';
import KPICard from '../KPICard';
import OnboardingStepper from '../OnboardingStepper';
import RecentAlertsSummary from '../RecentAlertsSummary';
import ShopifyConnector from '../ShopifyConnector';
import StockChart from '../StockChart';
import WasteReductionReport from '../WasteReductionReport';

describe('ErrorBoundary', () => {
  it('shows a fallback when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Boom = () => {
      throw new Error('boom');
    };
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('fine')).toBeInTheDocument();
  });
});

describe('KPICard', () => {
  it('shows title and value', () => {
    render(<KPICard title="Total sales" value="£5,000" icon="💷" />);
    expect(screen.getByText('Total sales')).toBeInTheDocument();
    expect(screen.getByText('£5,000')).toBeInTheDocument();
  });

  it('is a button that fires onClick when given a handler', () => {
    const onClick = vi.fn();
    render(<KPICard title="Sales" value="1" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('AlertCard', () => {
  it('renders details and dismisses', () => {
    const onDismiss = vi.fn();
    render(<AlertCard title="Low stock" details={['2 left']} onDismiss={onDismiss} />);
    expect(screen.getByText('2 left')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('has no dismiss button without a handler', () => {
    render(<AlertCard title="Info" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('EventBanner', () => {
  it('pluralises the countdown', () => {
    const { rerender } = render(<EventBanner eventName="Eid" daysRemaining={3} />);
    expect(screen.getByText('Event in 3 days')).toBeInTheDocument();
    rerender(<EventBanner eventName="Eid" daysRemaining={1} />);
    expect(screen.getByText('Event in 1 day')).toBeInTheDocument();
    rerender(<EventBanner eventName="Eid" daysRemaining={0} />);
    expect(screen.getByText('Event is today')).toBeInTheDocument();
  });
});

describe('CulturalCalendar', () => {
  const events = [
    { id: 3, name: 'Event 3', start_date: '2023-11-18' },
    { id: 1, name: 'Event 1', start_date: '2023-10-05' },
    { id: 2, name: 'Event 2', start_date: '2023-10-12' },
  ];

  it('groups events under month headings in date order', () => {
    render(<CulturalCalendar events={events} />);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['October 2023', 'November 2023']);
    expect(screen.getByText('Event 2')).toBeInTheDocument();
  });

  it('shows a message when there are no events', () => {
    render(<CulturalCalendar events={[]} />);
    expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
  });
});

describe('FreightAlert', () => {
  const alert = {
    id: 1,
    shipping_lane: 'CN-UK-SEA',
    baseline_rate: '1000.00',
    current_rate: '1200.00',
    change_percent: 20,
  };

  it('shows the lane, the rates and a signed percentage', () => {
    render(<FreightAlert alert={alert} />);
    expect(screen.getByText('CN-UK-SEA')).toBeInTheDocument();
    expect(screen.getByText('£1000.00 → £1200.00')).toBeInTheDocument();
    expect(screen.getByText('+20.0%')).toHaveClass('text-red-600');
  });

  it('colours a falling rate green and dismisses with the alert', () => {
    const onDismiss = vi.fn();
    render(<FreightAlert alert={{ ...alert, change_percent: -5 }} onDismiss={onDismiss} />);
    expect(screen.getByText('-5.0%')).toHaveClass('text-green-600');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
});

describe('RecentAlertsSummary', () => {
  it('shows an empty message', () => {
    render(<RecentAlertsSummary alerts={[]} />);
    expect(screen.getByText('No recent alerts.')).toBeInTheDocument();
  });

  it('shows only the five newest alerts, newest first', () => {
    const alerts = Array.from({ length: 7 }, (_, i) => ({
      id: i,
      type: 'stock',
      title: `Alert ${i}`,
      created_at: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    render(<RecentAlertsSummary alerts={alerts} />);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toHaveLength(5);
    expect(items[0]).toContain('Alert 6');
    expect(screen.queryByText('Alert 0')).toBeNull();
  });
});

describe('WasteReductionReport', () => {
  const now = new Date('2024-02-01T00:00:00Z');
  const markdown = {
    product: 7,
    old_price: '10.00',
    reason: 'decay_markdown',
    source: 'decay_markdown',
    is_approved: true,
    is_rejected: false,
  };
  const logs = [
    { ...markdown, id: 1, new_price: '7.50', changed_at: '2024-01-25T00:00:00Z' },
    { ...markdown, id: 2, new_price: '9.00', changed_at: '2023-11-01T00:00:00Z' }, // too old
    { ...markdown, id: 3, new_price: '9.00', source: 'manual', reason: 'manual', changed_at: '2024-01-30T00:00:00Z' },
    { ...markdown, id: 4, new_price: '8.00', is_approved: false, changed_at: '2024-01-26T00:00:00Z' }, // pending
    {
      ...markdown,
      id: 5,
      new_price: '8.00',
      is_approved: false,
      is_rejected: true,
      changed_at: '2024-01-27T00:00:00Z',
    },
  ];

  it('lists only recent approved markdowns with the amount saved', () => {
    render(<WasteReductionReport logs={logs} productNames={{ 7: 'Dates' }} now={now} />);
    expect(screen.getAllByRole('row')).toHaveLength(2); // header + one row
    expect(screen.getByText('Dates')).toBeInTheDocument();
    expect(screen.getByText('£2.50')).toBeInTheDocument();
  });

  it('shows a message when nothing qualifies', () => {
    render(<WasteReductionReport logs={logs.slice(1)} now={now} />);
    expect(screen.getByText('No markdowns in the last 30 days.')).toBeInTheDocument();
  });
});

describe('BranchList', () => {
  const branches = [{ id: 1, name: 'High St', address: '1 High St', is_active: true }];

  it('shows an empty state without branches', () => {
    render(<BranchList branches={[]} />);
    expect(screen.getByText('No branches yet')).toBeInTheDocument();
  });

  it('expands a branch to show tills and deactivates one', () => {
    const onDeactivateTill = vi.fn();
    render(
      <BranchList
        branches={branches}
        tillsByBranch={{ 1: [{ id: 9, name: 'Till A' }] }}
        onDeactivateTill={onDeactivateTill}
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /show tills \(1\)/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(onDeactivateTill).toHaveBeenCalledWith({ id: 9, name: 'Till A' });
  });
});

describe('EmptyState', () => {
  it('runs the action', () => {
    const onAction = vi.fn();
    render(<EmptyState title="Nothing" actionLabel="Add" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAction).toHaveBeenCalled();
  });
});

describe('OnboardingStepper', () => {
  const steps = [
    { label: 'One', content: <p>first</p> },
    { label: 'Two', content: <p>second</p> },
  ];

  it('moves between steps and finishes on the last', () => {
    const onFinish = vi.fn();
    render(<OnboardingStepper steps={steps} onFinish={onFinish} />);
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('second')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onFinish).toHaveBeenCalled();
  });
});

describe('ShopifyConnector', () => {
  it('opens a dialog that can be skipped or continued', () => {
    const onConnect = vi.fn();
    render(<ShopifyConnector onConnect={onConnect} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Connect to Shopify' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onConnect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Connect to Shopify' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onConnect).toHaveBeenCalled();
  });
});

describe('StockChart', () => {
  it('renders an svg chart', () => {
    const { container } = render(<StockChart data={[{ name: 'Mon', value: 5 }]} reorderThreshold={3} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});

describe('AlternativeSupplierCarousel', () => {
  it('lists supplier details', () => {
    render(
      <AlternativeSupplierCarousel
        suppliers={[
          { id: 1, name: 'Acme', country_of_origin: 'Turkey', lead_time_days: 12, product_categories: ['Dried fruit'] },
        ]}
      />
    );
    // infiniteLoop makes the carousel clone slides, so the name can appear more than once
    expect(screen.getAllByText('Acme').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/12 day lead time/).length).toBeGreaterThan(0);
  });

  it('shows a message with no suppliers', () => {
    render(<AlternativeSupplierCarousel suppliers={[]} />);
    expect(screen.getByText('No alternative suppliers.')).toBeInTheDocument();
  });
});

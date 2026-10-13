// Minimal Tailwind UI primitives used across the app.

import React from 'react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

export const Container = ({ className, ...props }) => (
  <div className={cx('mx-auto w-full max-w-7xl px-4', className)} {...props} />
);

export const Box = ({ className, ...props }) => <div className={className} {...props} />;

export const Card = ({ className, ...props }) => (
  <div className={cx('rounded-lg border border-gray-200 bg-white p-4 shadow-sm', className)} {...props} />
);

export const Text = ({ className, ...props }) => <p className={cx('text-sm text-gray-700', className)} {...props} />;

const BUTTON_VARIANTS = {
  primary: 'bg-primary text-white hover:bg-blue-900',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

/* eslint-disable react/button-has-type -- `type` defaults to "button"; callers pass "submit" explicitly */
export const Button = ({ variant = 'primary', className, type = 'button', ...props }) => (
  <button
    type={type}
    className={cx(
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
      BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
      className
    )}
    {...props}
  />
);
/* eslint-enable react/button-has-type */

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cx(
      'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm',
      'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Form = ({ className, ...props }) => <form className={cx('space-y-4', className)} {...props} />;

const BADGE_COLORS = {
  gray: 'bg-gray-100 text-gray-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
};

export const Badge = ({ color = 'gray', className, ...props }) => (
  <span
    className={cx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      BADGE_COLORS[color] || BADGE_COLORS.gray,
      className
    )}
    {...props}
  />
);

export const Skeleton = ({ className, ...props }) => (
  <div className={cx('animate-pulse rounded bg-gray-200', className || 'h-4 w-full')} {...props} />
);

export const Select = ({ className, children, ...props }) => (
  <select
    className={cx(
      'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
      'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
      className
    )}
    {...props}
  >
    {children}
  </select>
);

export const Option = (props) => <option {...props} />;

export const List = ({ className, ...props }) => (
  <ul className={cx('divide-y divide-gray-100', className)} {...props} />
);
export const ListItem = ({ className, ...props }) => <li className={cx('py-2 text-sm', className)} {...props} />;

export const Table = ({ className, children, ...props }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className={cx('min-w-full divide-y divide-gray-200 text-sm', className)} {...props}>
      {children}
    </table>
  </div>
);
export const Thead = ({ className, ...props }) => <thead className={cx('bg-gray-50', className)} {...props} />;
export const Tbody = ({ className, ...props }) => (
  <tbody className={cx('divide-y divide-gray-100 bg-white', className)} {...props} />
);
export const Tr = (props) => <tr {...props} />;
export const Th = ({ className, ...props }) => (
  <th className={cx('px-4 py-2 text-left font-semibold text-gray-600', className)} {...props} />
);
export const Td = ({ className, ...props }) => <td className={cx('px-4 py-2 text-gray-800', className)} {...props} />;

export const Modal = ({ isOpen = true, open, onClose, title, children }) => {
  if (!(open ?? isOpen)) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-800">
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export const Stepper = ({ activeStep = 0, className, children }) => (
  <ol className={cx('flex items-center gap-4', className)}>
    {React.Children.map(children, (child, index) =>
      React.isValidElement(child)
        ? React.cloneElement(child, { index, active: index === activeStep, done: index < activeStep })
        : child
    )}
  </ol>
);
export const Step = ({ index, active, done, children }) => (
  <li className="flex items-center gap-2">
    <span
      className={cx(
        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
        active || done ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
      )}
    >
      {(index ?? 0) + 1}
    </span>
    {children}
  </li>
);
export const StepLabel = ({ children }) => <span className="text-sm text-gray-700">{children}</span>;

export const Timeline = ({ className, ...props }) => (
  <ol className={cx('space-y-4 border-l border-gray-200 pl-4', className)} {...props} />
);
export const TimelineItem = ({ className, ...props }) => <li className={cx('text-sm', className)} {...props} />;

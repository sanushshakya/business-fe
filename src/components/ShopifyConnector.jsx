import React from 'react';
import { Button, Modal } from '@/components/ui';

/**
 * Onboarding step offering to connect Shopify. `onConnect` is called when the user continues;
 * skipping just closes the dialog.
 */
const ShopifyConnector = ({ onConnect }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Connect to Shopify</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Shopify connection">
        <p className="mb-4 text-sm text-gray-700">
          Connect your store to sync approved price changes, or skip and do it later.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              onConnect?.();
              setOpen(false);
            }}
          >
            Continue
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Skip
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ShopifyConnector;

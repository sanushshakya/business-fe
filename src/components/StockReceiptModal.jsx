import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Modal } from '@/components/ui';
import ProductSelect from './ProductSelect';
import LocationSelect from './stock/LocationSelect';

/**
 * Records a stock batch; `onSubmit` gets `{product, batch_number, quantity, expiration_date, location}`
 * (the shape POST /inventory/batches/ expects). `locations` are the company's; `defaultLocation` is picked
 * each time the form opens (the page's chosen location, or the only shop floor). `error` is the server's answer
 * to the last save, shown in the form.
 */
const StockReceiptModal = ({
  isOpen,
  onClose,
  onSubmit,
  submitting = false,
  locations = [],
  defaultLocation = '',
  error = null,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { product: '' } });

  React.useEffect(() => {
    register('product', { required: 'Product is required' });
    register('location', { required: 'Location is required' });
  }, [register]);

  React.useEffect(() => {
    if (isOpen) setValue('location', defaultLocation ?? '');
  }, [isOpen, defaultLocation, setValue]);

  const submit = async (values) => {
    try {
      await onSubmit({
        product: Number(values.product),
        batch_number: values.batch_number,
        quantity: Number(values.quantity),
        expiration_date: values.expiration_date,
        location: Number(values.location),
      });
    } catch {
      return; // the page shows the error; keep what was typed
    }
    reset();
  };

  const field = (id, label, type, rules) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <Input id={id} type={type} {...register(id, rules)} />
      {errors[id] && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {errors[id].message}
        </p>
      )}
    </div>
  );

  return (
    <Modal open={isOpen} onClose={onClose} title="Receive stock">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label htmlFor="product" className="mb-1 block text-sm font-medium">
            Product
          </label>
          <ProductSelect
            value={watch('product')}
            onChange={(value) => setValue('product', value, { shouldValidate: true })}
          />
          {errors.product && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {errors.product.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="receive-location" className="mb-1 block text-sm font-medium">
            Receive at
          </label>
          <LocationSelect
            id="receive-location"
            label="Receive at"
            locations={locations}
            value={watch('location')}
            onChange={(value) => setValue('location', value, { shouldValidate: true })}
          />
          {errors.location && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {errors.location.message}
            </p>
          )}
        </div>
        {field('batch_number', 'Batch number', 'text', { required: 'Batch number is required' })}
        {field('quantity', 'Quantity', 'number', {
          required: 'Quantity is required',
          min: { value: 1, message: 'Quantity must be at least 1' },
        })}
        {field('expiration_date', 'Expiration date', 'date', { required: 'Expiration date is required' })}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </Modal>
  );
};

export default StockReceiptModal;

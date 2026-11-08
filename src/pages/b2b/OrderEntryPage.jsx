import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { ukToday } from '../../utils/dateUtils';
import { apiErrorMessage } from '../../utils/http';
import OrderEntry from '../../components/b2b/OrderEntry';
import useApiList from '../../hooks/useApiList';

/** A new trade order taken from the keyboard (G46a); saved as a draft, or saved and confirmed (G40). */
const OrderEntryPage = () => {
  const navigate = useNavigate();
  const customers = useApiList('/wholesale/customers/');
  const products = useApiList('/inventory/products/');
  const [error, setError] = React.useState(null);

  const resolve = (customer, on, lines) =>
    axios.post('/wholesale/prices/resolve/', { customer, on, lines }).then(({ data }) => data.lines);

  const save = async (body, { confirm }) => {
    let order;
    try {
      ({ data: order } = await axios.post('/wholesale/orders/', body));
    } catch (failure) {
      setError(apiErrorMessage(failure, 'Could not save the order.'));
      throw failure;
    }
    let message = null;
    if (confirm) {
      try {
        await axios.post(`/wholesale/orders/${order.id}/confirm/`, {});
      } catch (failure) {
        // Saved as a draft: say why it isn't confirmed; it can be confirmed from the order.
        message = `Saved as a draft, not confirmed: ${apiErrorMessage(failure, 'try again from the order.')}`;
      }
    }
    navigate(`/dashboard/b2b/orders/${order.id}`, { state: message ? { message } : undefined });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">New trade order</h2>
      <OrderEntry
        customers={(customers.data ?? []).filter((customer) => customer.status !== 'closed')}
        products={products.data ?? []}
        onResolve={resolve}
        onSave={save}
        today={ukToday()}
        error={error}
      />
    </section>
  );
};

export default OrderEntryPage;

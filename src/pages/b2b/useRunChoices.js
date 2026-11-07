import useApiList from '../../hooks/useApiList';

/** What a run is planned from (G44): active, non-sellable vans; active drivers; picked orders. */
export default function useRunChoices(extraOrders = []) {
  const locations = useApiList('/inventory/locations/');
  const operators = useApiList('/tenants/operators/');
  const picked = useApiList('/wholesale/orders/?status=picked');
  const vans = (locations.data ?? []).filter(
    (l) => l.type === 'van' && l.is_active && !l.sellable && !l.online_sellable
  );
  const drivers = (operators.data ?? []).filter((person) => person.role === 'driver' && person.is_active);
  const seen = new Set();
  const orders = [...extraOrders, ...(picked.data ?? [])].filter((order) => !seen.has(order.id) && seen.add(order.id));
  return { vans, drivers, orders };
}

// src/components/FreightAlert.jsx
import React from 'react';
import { useInventory } from '../hooks/useInventory';

/**
 * @module src/components/FreightAlert.jsx
 */

/**
 * FreightAlert component to display alert information.
 * @function
 * @param {Object} props - The component props.
 * @returns {JSX.Element}
 */
const FreightAlert = ({ alert }) => {
  const { fetchInventory } = useInventory();

  React.useEffect(() => {
    if (alert.needInventory) {
      fetchInventory();
    }
  }, [alert, fetchInventory]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border-b-2 border-green-500">
      <h3 className="text-xl font-bold mb-2">{alert.title}</h3>
      <p className="text-gray-600">{alert.description}</p>
      {alert.needInventory && (
        <div className="mt-4">
          <button onClick={() => fetchInventory()} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Fetch Inventory
          </button>
        </div>
      )}
    </div>
  );
};

export default FreightAlert;
```

```jsx
// src/components/AlternativeSupplierCarousel.jsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';

/**
 * @module src/components/AlternativeSupplierCarousel.jsx
 */

/**
 * AlternativeSupplierCarousel component to display alternative suppliers in a carousel.
 * @function
 * @param {Object} props - The component props.
 * @returns {JSX.Element}
 */
const AlternativeSupplierCarousel = ({ suppliers }) => {
  return (
    <Swiper pagination={true}>
      {suppliers.map((supplier, index) => (
        <SwiperSlide key={index} className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-2">{supplier.name}</h3>
          <p className="text-gray-600">{supplier.description}</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Contact Supplier
          </button>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default AlternativeSupplierCarousel;
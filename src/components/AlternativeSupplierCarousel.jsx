import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

/**
 * Swipeable cards for alternative suppliers (/logistics/alternative-suppliers/).
 */
const AlternativeSupplierCarousel = ({ suppliers = [] }) => {
  if (suppliers.length === 0) return <p className="text-sm text-gray-500">No alternative suppliers.</p>;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Carousel autoPlay interval={4000} showThumbs={false} infiniteLoop>
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="mb-4 rounded-lg bg-white p-4 shadow-md">
            <h3 className="text-xl font-bold">{supplier.name}</h3>
            <p className="mt-2 text-gray-700">
              {supplier.country_of_origin} · {supplier.lead_time_days} day lead time
            </p>
            <p className="mt-1 text-sm text-gray-500">{(supplier.product_categories || []).join(', ')}</p>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default AlternativeSupplierCarousel;

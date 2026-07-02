import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

/**
 * AlternativeSupplierCarousel component to display alternative suppliers with contact links.
 *
 * @param {Object} props - The component props.
 * @param {Array} props.suppliers - An array of supplier objects.
 * @returns {JSX.Element} The rendered component.
 */
const AlternativeSupplierCarousel = ({ suppliers }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Carousel autoPlay interval={3000} showThumbs={false} infiniteLoop>
        {suppliers.map((supplier, index) => (
          <div key={index} className="bg-white p-4 shadow-md rounded-lg mb-4">
            <h2 className="text-xl font-bold">{supplier.name}</h2>
            <p className="mt-2 text-gray-700">{supplier.description}</p>
            <a
              href={`mailto:${supplier.email}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Contact Supplier
            </a>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default AlternativeSupplierCarousel;
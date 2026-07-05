import React from 'react';
import Modal from './Modal';

/**
 * ShopifyConnector component to provide an optional button to connect to Shopify.
 *
 * @returns {React.FC} - The ShopifyConnector component
 */
const ShopifyConnector = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  /**
   * Handles opening the modal.
   */
  const openModal = () => setIsModalOpen(true);

  /**
   * Handles closing the modal.
   */
  const closeModal = () => setIsModalOpen(false);

  return (
    <div>
      <button onClick={openModal}>Connect to Shopify</button>
      {isModalOpen && (
        <Modal onClose={closeModal}>
          <h2>Shopify Connection</h2>
          <p>Click the button below to skip connecting to Shopify.</p>
          <button onClick={() => closeModal()}>Skip</button>
        </Modal>
      )}
    </div>
  );
};

export default ShopifyConnector;
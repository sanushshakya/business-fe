import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { OnboardingCompleteSerializer } from '../serializers/OnboardingCompleteSerializer';

/**
 * UpdateOnboardingCompleteView component to handle PATCH request for updating onboarding complete status.
 *
 * @returns {React.FC} - The UpdateOnboardingCompleteView component
 */
const UpdateOnboardingCompleteView: React.FC = () => {
  const authStore = useAuthStore();
  const { token } = authStore;

  /**
   * Handles the PATCH request to update the onboarding complete status.
   *
   * @param {any} data - The data containing the new onboarding status.
   * @returns {Promise<void>} - A promise that resolves when the PATCH request is completed.
   */
  const handlePatchRequest = async (data: any): Promise<void> => {
    try {
      // Serialize the data using OnboardingCompleteSerializer
      const serializedData = OnboardingCompleteSerializer(data);

      // Make the PATCH request to update onboarding complete status
      const response = await fetch('/api/onboarding-complete', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(serializedData),
      });

      // Check if the response is successful
      if (!response.ok) {
        throw new Error('Failed to update onboarding complete status');
      }

      console.log('Onboarding complete status updated successfully');
    } catch (error) {
      console.error('Error updating onboarding complete status:', error);
    }
  };

  return (
    <div>
      {/* Render your component UI here */}
      <button onClick={() => handlePatchRequest({ isComplete: true })}>Mark Onboarding Complete</button>
    </div>
  );
};

export default UpdateOnboardingCompleteView;
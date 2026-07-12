/**
 * Custom hook to manage synchronization logic based on network status and batch processing using rxdbBatchService.
 *
 * This hook listens for 'online' and 'offline' events from the window object.
 * When the network status changes, it triggers a callback function to perform
 * necessary actions such as syncing data with the server or storing data locally,
 * utilizing the batching service for efficient record processing.
 *
 * @returns {void}
 */
const useSyncManager = () => {
  const [syncingStatus, setSyncingStatus] = useState(false);
  const [syncCount, setSyncCount] = useState(0);

  const checkNetworkStatus = async (event) => {
    if (navigator.onLine) {
      // Perform actions when the network is online
      console.log('Network is now online');
      try {
        // Batch process records using rxdbBatchService
        await rxdbBatchService.processBatch();
        setSyncCount(prevCount => prevCount + 1);
        setSyncingStatus(false);
        console.log('Records synced and processed successfully');
      } catch (error) {
        console.error('Error syncing and processing records:', error);
      }
    } else {
      // Perform actions when the network is offline
      console.log('Network is now offline');
      setSyncingStatus(true);
      // Example: Store data locally or perform other necessary actions
    }
  };

  const handleSyncConfirmation = async (uuid) => {
    try {
      // Assuming getRecord and updateRecord are defined elsewhere in your application
      const record = await getRecord(uuid);
      if (record) {
        record.set('synced', true);
        await record.save();
        console.log(`Record with UUID ${uuid} has been marked as synced.`);
      } else {
        console.warn(`No record found for UUID ${uuid}.`);
      }
    } catch (error) {
      console.error(`Error updating synced status for UUID ${uuid}:`, error);
    }
  };

  const updateLastSeenAt = async () => {
    try {
      // Assuming getCurrentTill is defined elsewhere in your application
      const till = await getCurrentTill();
      if (till) {
        till.set('last_seen_at', new Date());
        await till.save();
        console.log(`last_seen_at updated for Till with ID ${till.id}`);
      } else {
        console.warn('No Till found to update last_seen_at.');
      }
    } catch (error) {
      console.error(`Error updating last_seen_at for Till:`, error);
    }
  };

  useEffect(() => {
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);

    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

  useEffect(() => {
    // Update last_seen_at every time the WebSocket connection is established
    const handleWebSocketConnection = () => {
      updateLastSeenAt();
    };

    WebSocketService.on('connect', handleWebSocketConnection);

    return () => {
      WebSocketService.off('connect', handleWebSocketConnection);
    };
  }, []);

  // Additional logic to handle synchronization can be added here

  return { syncingStatus, syncCount, handleSyncConfirmation }; // Return the function for use elsewhere if needed
};

export default useSyncManager;
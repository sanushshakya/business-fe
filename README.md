## README.md

### Fetching Event Dates

To fetch event dates from `/api/demand/calendar/?months=3`, you can use the following endpoint:

- **URL**: `/api/demand/calendar/?months=3`
- **Method**: GET
- **Description**: Retrieves event dates for the next three months.
- **Response**:
  - Status: `200 OK`
  - Content-Type: `application/json`
  - Body: Array of event date objects.

Example response:
```json
[
  {
    "date": "2023-10-01",
    "events": [
      {
        "id": 1,
        "title": "Event 1"
      },
      {
        "id": 2,
        "title": "Event 2"
      }
    ]
  },
  {
    "date": "2023-10-02",
    "events": [
      {
        "id": 3,
        "title": "Event 3"
      }
    ]
  }
]
```

### Price Changes Component

The `PriceChangesPage` component is used to display price changes for products. It utilizes the `useInventory` hook to fetch inventory data directly from the backend.

- **Usage**:
```jsx
import React from 'react';
import PriceChangesPage from './src/components/PriceChangesPage';

const App = () => {
  return (
    <div>
      <h1>Price Changes</h1>
      <PriceChangesPage />
    </div>
  );
};

export default App;
```

### EventCard Component

The `EventCard` component is used to display event information. It utilizes the `useNetworkStatus` hook to manage network status and the `useInventory` hook to fetch inventory data directly from the backend.

- **Usage**:
```jsx
import React from 'react';
import EventCard from './src/components/EventCard';

const App = () => {
  return (
    <div>
      <h1>Events</h1>
      <EventCard />
    </div>
  );
};

export default App;
```

### useNetworkStatus Hook

The `useNetworkStatus` hook is a Zustand store for managing network status. It provides a boolean value indicating whether the user is online or offline.

- **Usage**:
```jsx
import React from 'react';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';

const App = () => {
  const isOnline = useNetworkStatus();

  return (
    <div>
      <h1>Network Status</h1>
      <p>{isOnline ? 'Online' : 'Offline'}</p>
    </div>
  );
};

export default App;
```

### My Suppliers Panel Feature

The new feature allows the application to fetch user suppliers directly from the backend, ensuring that data is up-to-date without requiring a manual refresh.

- **Description**:
  - The `MySuppliersPanel` component displays the UserSupplier list in a table and manages suppliers.
  - It utilizes the `useSyncManager` hook to manage synchronization logic based on network status and batch size.

- **API Endpoints**
  - **Get User Suppliers**
    - **URL**: `/api/suppliers/`
    - **Method**: GET
    - **Description**: Retrieves the list of user suppliers.
    - **Response**:
      - Status: `200 OK`
      - Content-Type: `application/json`

- **Usage**:
```jsx
import React from 'react';
import MySuppliersPanel from './src/feature';

const App = () => {
  return (
    <div>
      <h1>My Suppliers</h1>
      <MySuppliersPanel />
    </div>
  );
};
```

### Version Updates

- **PriceChangesPage Component**: Updated to use the latest `useInventory` hook for better data fetching efficiency.
- **MySuppliersPanel Feature**: Added support for batch synchronization based on network status.

These updates ensure that the application remains up-to-date with the latest backend features and optimizations.
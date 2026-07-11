## Fetching Event Dates

To fetch event dates from `/api/demand/calendar/?months=3`, you can use the following endpoint:

### Endpoint
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

## Price Changes Component

The `PriceChangesPage` component is used to display price changes for products. It utilizes the `useInventory` hook to fetch inventory data directly from the backend.

### Usage
To use the `PriceChangesPage` component, import it into your application and render it:

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

## EventCard Component

The `EventCard` component is used to display event information. It utilizes the `useNetworkStatus` hook to manage network status and the `useInventory` hook to fetch inventory data directly from the backend.

### Usage
To use the `EventCard` component, import it into your application and render it:

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

## useNetworkStatus Hook

The `useNetworkStatus` hook is a Zustand store for managing network status. It provides a boolean value indicating whether the user is online or offline.

### Usage
To use the `useNetworkStatus` hook, import it into your application and access its state:

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

## My Suppliers Panel Feature

The new feature allows the application to fetch user suppliers directly from the backend, ensuring that data is up-to-date without requiring a manual refresh.

### Description
- The `MySuppliersPanel` component displays the UserSupplier list in a table and manages suppliers.
- It utilizes the `useSyncManager` hook to manage synchronization logic based on network status and batch size.

### API Endpoints
#### Get User Suppliers
- **URL**: `/api/suppliers/`
- **Method**: GET
- **Description**: Retrieves the list of user suppliers.
- **Response**:
  - Status: `200 OK`
  - Content-Type: `application/json`
  - Body: Array of supplier objects.

Example response:
```json
[
  {
    "id": 1,
    "name": "Supplier A",
    "email": "suppliera@example.com"
  },
  {
    "id": 2,
    "name": "Supplier B",
    "email": "supplierb@example.com"
  }
]
```

#### Fetch User Suppliers in Real-Time
- **Description**: The new feature allows the application to fetch user suppliers directly from the backend, ensuring that data is up-to-date without requiring a manual refresh.

## Add Supplier Form

The `AddSupplierForm` component is used to add new suppliers. It utilizes the Sheet/Drawer usage pattern for form submission.

### Usage
To use the `AddSupplierForm` component, import it into your application and render it:

```jsx
import React from 'react';
import AddSupplierForm from './src/components/AddSupplierForm';

const App = () => {
  return (
    <div>
      <h1>Add Supplier</h1>
      <AddSupplierForm />
    </div>
  );
};

export default App;
```

## Settings Page

The `SettingsPage` component is used to manage various settings, including company information, branches, and integrations.

### Tabs
- **Company**: Edit name, registration number, address, logo upload
- **Branches**: List all branches with edit/add/deactivate actions
- **Integrations**: Show Shopify connection status with Connect / Disconnect button and WooCommerce placeholder

### Usage
To use the `SettingsPage` component, import it into your application and render it:

```jsx
import React from 'react';
import SettingsPage from './src/components/SettingsPage';

const App = () => {
  return (
    <div>
      <h1>Settings</h1>
      <SettingsPage />
    </div>
  );
};

export default App;
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a pull request.

## Code of Conduct

Please adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) when contributing.
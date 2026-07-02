# iq-fe

Welcome to the `iq-fe` project! This is a Vite React application designed for building modern web applications.

## Table of Contents
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Fetching Event Dates](#fetching-event-dates)
- [Price Changes Component](#price-changes-component)
- [EventCard Component](#eventcard-component)
- [useNetworkStatus Hook](#usenetworkstatus-hook)
- [My Suppliers Panel Feature](#my-suppliers-panel-feature)
  - [Description](#description)
  - [API Endpoints](#api-endpoints)
    - [Get User Suppliers](#get-user-suppliers)
  - [Add Supplier Form](#add-supplier-form)
    - [Sheet/Drawer Usage](#sheetdrawer-usage)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)

## Getting Started

### Prerequisites
- Node.js (>=16.0.0)
- npm (or yarn)

### Installation
To get started with this project,

## Project Structure

The project is organized as follows:
- `src/`: Source code directory containing the React components and logic.
- `public/`: Static assets and public files.
- `README.md`: This file.

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

The `PriceChangesPage` component is a React component that displays a table of price changes for products. The table includes columns for Product Name, Old Price (£), New Price (£), Change %, Reason badge (Invoice Update / Decay Markdown / Manual), Triggered At, and Status (Auto-Applied / Pending Approval / Approved / Rejected). Additionally, there are action buttons to Approve and Reject the changes, which are visible only in `require_approval` mode.

### Props
- `data`: An array of objects containing price change data for each product.
- `onApprove`: A function called when a row is approved.
- `onReject`: A function called when a row is rejected.

## EventCard Component

The `EventCard` component now fetches its records directly from RxDB instead of fetching them via an API endpoint. This change ensures that the component displays data immediately without any delay caused by network latency.

### Props
- `eventDate`: An object representing the event date and its associated events.
  - `date`: A string representing the date in YYYY-MM-DD format.
  - `events`: An array of objects representing individual events on this date.

### Usage Example
```jsx
<EventCard eventDate={eventData} />
```

## useNetworkStatus Hook

The `useNetworkStatus` hook uses Zustand for state management to track and update the network status.

## My Suppliers Panel Feature

### Description
The My Suppliers panel is a feature that displays the UserSupplier list in a table with an Add Supplier form in a sheet/drawer. This allows users to manage their suppliers efficiently, either by viewing existing ones or adding new ones as needed.

### API Endpoints
#### Get User Suppliers
- **URL**: `/api/suppliers`
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
    "email": "supplier.a@example.com"
  },
  {
    "id": 2,
    "name": "Supplier B",
    "email": "supplier.b@example.com"
  }
]
```

### Add Supplier Form
The Add Supplier form can be opened from the My Suppliers panel. It allows users to input new supplier details and submit them.

#### Sheet/Drawer Usage
- **Trigger**: Clicking a button or icon in the table.
- **Component**: The sheet/drawer component is used to open the Add Supplier form.
- **Props**:
  - `openModal`: A function to open the modal.
  - `closeModal`: A function to close the modal.

Example usage:
```jsx
<Sheet open={isModalOpen} onOpenChange={(open) => setIsModalOpen(open)}>
  <Form onSubmit={handleAddSupplier}>
    {/* Form fields for supplier details */}
    <Button type="submit">Submit</Button>
  </Form>
</Sheet>
```

## Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) file for more information on how to contribute.

## Code of Conduct

We have adopted a code of conduct that we expect all contributors to adhere to. Please read our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) file for more information.
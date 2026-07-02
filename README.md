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
    - **New Feature**: Fetch User Suppliers in Real-Time
      - **Description**: The new feature allows the application to fetch user suppliers directly from the backend, ensuring that data is up-to-date without requiring a manual refresh.
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
  - `date`: A string representing the date in YYYY-MM-DD

```markdown
- [x] Implement new feature to fetch user suppliers in real-time.
```

## My Suppliers Panel Feature

The `MySuppliersPanel` component is a React component that displays the UserSupplier list in a table and manages suppliers.

### Description
The `MySuppliersPanel` component allows users to view, add, and manage their suppliers. It uses hooks such as `useSyncManager` to fetch and update supplier data dynamically.

### API Endpoints

#### Get User Suppliers
- **URL**: `/api/suppliers/user`
- **Method**: GET
- **Description**: Retrieves the list of suppliers associated with the current user.
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
    "contact": "contact@suppliera.com"
  },
  {
    "id": 2,
    "name": "Supplier B",
    "contact": "contact@supplierb.com"
  }
]
```

#### Add Supplier Form
- **Description**: The new feature allows the application to fetch user suppliers directly from the backend, ensuring that data is up-to-date without requiring a manual refresh.

### Sheet/Drawer Usage

The `MySuppliersPanel` component uses a modal sheet or drawer for adding and managing suppliers. This ensures a smooth user experience while maintaining clean UI layout.
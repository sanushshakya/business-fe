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
- [Settings Page](#settings-page)
  - **Tabs**:
    - **Company**: Edit name, registration number, address, logo upload
    - **Branches**: List all branches with edit/add/deactivate actions
    - **Integrations**: Show Shopify connection status with Connect / Disconnect button and WooCommerce placeholder
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)

## Getting Started

### Prerequisites
- Node.js (>=16.0.0)
- npm (or yarn)

### Installation
To get started with this project, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/iq-fe.git
   ```
2. Navigate to the project directory:
   ```sh
   cd iq-fe
   ```
3. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

### Running the Project
To run the development server, use one of the following commands:

1. Using npm:
   ```sh
   npm run dev
   # or
   npm start
   ```
2. Using yarn:
   ```sh
   yarn dev
   # or
   yarn start
   ```

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

The `PriceChangesPage` component is a React component that displays a table of price changes for products. The table includes columns for Product Name, Old Price (£), New Price (£), Change %, Reason badge (Invoice Update / Decay Markdown / Manual), Triggered At, and Status (Auto-Applied / Pending Approval / Approved / Rejected). Ad
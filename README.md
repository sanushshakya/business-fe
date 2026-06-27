---
# iq-fe

Welcome to the `iq-fe` project! This is a Vite React application designed for building modern web applications.

## Table of Contents
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Fetching Event Dates](#fetching-event-dates)
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

## Contributing

We welcome contributions from the community! If you have an idea or a fix, please follow these steps:

1. **Fork the repository** on GitHub.
2. **Create your feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit your changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push to the branch**: `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

Please make sure to update tests as appropriate.

## Code of Conduct

We expect all contributors and users to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

---

This document outlines the guidelines for contributing to this project and maintaining a respectful and productive community.
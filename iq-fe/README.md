# iq-fe

Welcome to the `iq-fe` project! This is a Vite React application designed for building modern web applications.

## Table of Contents
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Getting Started

### Prerequisites
- Node.js (>=16.0.0)
- npm (or yarn)

### Installation
To get started with this project, clone the repository and install dependencies:

```sh
git clone https://github.com/your-repo/iq-fe.git
cd iq-fe
npm install
```

Or using yarn:

```sh
git clone https://github.com/your-repo/iq-fe.git
cd iq-fe
yarn install
```

### Running the Project
To start the development server with hot-reload, run:

```sh
npm run dev
```

Or using yarn:

```sh
yarn dev
```

This will start the Vite server on `http://localhost:3000`.

## Project Structure

The project is structured as follows:

- `public/`: Static files served directly by the Vite server.
- `src/`: Source code of the application.
  - `assets/`: Images, fonts, etc.
  - `components/`: React components.
  - `pages/`: Pages for routing.
  - `styles/`: Global styles and CSS modules.
  - `App.jsx`: Main application component.
  - `main.jsx`: Entry point of the application.
- `.gitignore`: Files to be ignored by Git.
- `package.json`: Project dependencies and scripts.
- `README.md`: This file.

## Contributing

Contributions are welcome! Before submitting a pull request, make sure to:

1. Run the tests locally using:
   ```sh
   npm run test
   ```
   Or using yarn:
   ```sh
   yarn test
   ```

2. Format your code using Prettier:
   ```sh
   npm run format
   ```
   Or using yarn:
   ```sh
   yarn format
   ```

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

Enjoy building with `iq-fe`!
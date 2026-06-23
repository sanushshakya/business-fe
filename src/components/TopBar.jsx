// src/components/TopBar.jsx

import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';

/**
 * TopBar component represents the top navigation bar of the application.
 *
 * @component
 * @returns {JSX.Element} - The rendered TopBar component.
 */
const TopBar = () => {
  return (
    <Navbar bg="dark" variant="dark">
      <Container fluid>
        <Navbar.Brand href="#home">iq-fe</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="#home">Home</Nav.Link>
          <Nav.Link href="#features">Features</Nav.Link>
          <Nav.Link href="#pricing">Pricing</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default TopBar;
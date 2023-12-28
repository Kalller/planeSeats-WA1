import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import clouds from '../assets/clouds.svg';
import { Navbar, Container, Button, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { LogoutButton, LoginForm } from './Auth';

function Navigation(props) {
  return (
    <Navbar className="row nav-style sticky-top" variant="dark">
      <Container fluid>
      <Link to="/" className="navbar-brand">
  <img src={clouds} style={{ marginRight: '5px' }} />
  <span style={{ fontWeight: 'bold' }}>FluffySkies</span>
</Link>

        {props.user && props.user.username && (
          <div className="d-flex justify-content-end align-items-center">
            <div className="h5 mb-0" style={{ paddingRight: '1rem' }}>{props.user.username}</div>
            <LogoutButton logout={props.logout} />
          </div>
        )}
        {!props.loggedIn && (
          <Link to='/login' className='btn btn-outline-light'>Login</Link>
        )}
      </Container>
    </Navbar>
  );
}

function NotFoundLayout() {
  return (
    <Row className="below-nav">
      <h2>This is not the route you are looking for!</h2>
      <Link to="/">
        <Button variant="primary">Go Home!</Button>
      </Link>
    </Row>
  );
}

function LoginLayout(props) {
  return (
    <Row className="vh-100">
      <Col className="below-nav">
        <LoginForm login={props.login} />
      </Col>
    </Row>
  );
}

export { Navigation, NotFoundLayout, LoginLayout };

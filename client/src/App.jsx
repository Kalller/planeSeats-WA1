import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { React, useState, useEffect } from 'react';
import { Container } from 'react-bootstrap/'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { Navigation, NotFoundLayout } from './components/UtilityLayouts';
import HomePage from './components/HomePage';
import PlaneOverview from './components/PlaneOverview';
import { LoginForm } from './components/Auth';
import API from './API';



function App() {

  // This state keeps track if the user is currently logged-in.
  const [loggedIn, setLoggedIn] = useState(false);
  // This state contains the user's info.
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await API.getUserInfo()  // here you have the user info, if already logged in
        setLoggedIn(true);
        setUser(user)

      } catch (err) {
        setLoggedIn(false);
      }
    };
    init();
  }, []);  // This useEffect is called only the first time the component is mounted.
  /*
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setUser(user)
    } catch (err) {
      throw err;
    }
  };

  /**
   * This function handles the logout process.
   */
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(null)
    // clean up everything

    
  };

  return (
    <BrowserRouter>
      <Container fluid className="App">
        <Navigation logout={handleLogout} user={user} loggedIn={loggedIn} />
        <Outlet />
        <Routes>
          <Route path="/" element={<Navigate to="/planes" />} />
          <Route path='planes/' element={<HomePage />} />
          <Route path="planes/:type" element={<PlaneOverview loggedIn={loggedIn} user={user} />} />
          <Route path="*" element={<NotFoundLayout />} />
          <Route path="/login" element={!loggedIn ? <LoginForm login={handleLogin} /> : <Navigate replace to='/' />} />
        </Routes>

      </Container>

    </BrowserRouter>
  );

}

export default App;

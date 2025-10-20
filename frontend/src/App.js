import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const switchToRegister = () => {
    setShowRegister(true);
  };

  const switchToLogin = () => {
    setShowRegister(false);
  };

  const handleRegistered = (email) => {
    // After successful registration, return to login with email prefilled
    setPrefillEmail(email || '');
    setShowRegister(false);
  };

  if (user) {
    return (
      <div className="container mt-5">
        <h1>Welcome, {user.name}!</h1>
        <p>Role: {user.role}</p>
        <button onClick={handleLogout} className="btn btn-danger">Logout</button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        <AppRoutes onLogin={handleLogin} onRegistered={handleRegistered} initialEmail={prefillEmail} />
      </div>
    </BrowserRouter>
  );
}

export default App;
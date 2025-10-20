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
    setPrefillEmail(email || '');
    setShowRegister(false);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <AppRoutes onLogin={handleLogin} onRegistered={handleRegistered} initialEmail={prefillEmail} />
      </div>
    </BrowserRouter>
  );
}

export default App;
import React, { useState } from 'react';
import { authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin, onSwitchToRegister, initialEmail = '' }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      const { user, token } = response.data;
      
      // Store user data and token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Call parent callback and go to dashboard
      onLogin(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="login-container"
      style={{
        backgroundImage: 'url(/pictures/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>
        
        {error && (
          <div className="login-alert login-alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="password">Password</label>
            <div className="login-password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="login-link"
              onClick={() => navigate('/register')}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

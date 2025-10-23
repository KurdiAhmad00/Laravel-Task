import React, { useState } from 'react';
import { authAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = ({ onRegistered, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Basic validation
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(formData);
      // After successful registration, go back to login with prefilled email
      if (onRegistered) onRegistered(formData.email);
      navigate('/login');
      return;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="register-container"
      style={{
        backgroundImage: 'url(/pictures/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="register-card">
        <div className="register-header">
          <h2>Create Account</h2>
          <p>Join the Incident Desk System</p>
        </div>
        
        {error && (
          <div className="register-alert register-alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="register-form-group">
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

          <div className="register-form-group">
            <label htmlFor="phone_number">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="password">Password</label>
            <div className="register-password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
                minLength="8"
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="register-form-group">
            <label htmlFor="password_confirmation">Confirm Password</label>
            <div className="register-password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="password_confirmation"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="register-link"
              onClick={() => navigate('/login')}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

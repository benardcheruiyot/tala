// Eligibility.js - User Registration/Eligibility Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';
import './Eligibility.css';

const Eligibility = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    national_id: '',
    loan_type: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const phone = formData.phone_number.trim();
      const nationalId = formData.national_id.trim();

      if (!phone || !nationalId || !formData.loan_type) {
        Swal.fire('Error', 'Please complete all required fields', 'error');
        setLoading(false);
        return;
      }

      // Check backend connectivity
      try {
        await fetch(`${apiBaseUrl}/health`);
      } catch (err) {
        throw new Error('Backend is unreachable. Please verify the API URL and server status.');
      }

      await login(formData.name.trim() || 'Customer', phone);

      await Swal.fire({
        title: 'Checking Eligibility',
        text: "We're verifying your details...",
        timer: 1800,
        timerProgressBar: false,
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      navigate('/processing');
    } catch (error) {
      console.error('[ELIGIBILITY] Error:', error);
      
      const message =
        error?.code === 'ERR_NETWORK'
          ? 'Cannot reach backend server. Please try again shortly.'
          : error.message || 'Registration failed';

      Swal.fire('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Header logoInitial="P" />

      <div className="eligibility-content">
        <div className="eligibility-card card">
          <h2>
            <span className="section-icon">👤</span>
            Personal Information
          </h2>

          <form onSubmit={handleSubmit} className="eligibility-form">
            <div className="form-group">
              <label htmlFor="name">Full Name (Optional)</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
              <small>Enter your full name as on your national ID</small>
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number *</label>
              <input
                id="phone_number"
                type="tel"
                name="phone_number"
                placeholder="Phone Number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <small>Safaricom only - e.g. 0712 345 678 or 0110 123 456</small>
            </div>

            <div className="requirements">
              <label htmlFor="national_id">National ID Number</label>
              <input
                id="national_id"
                type="text"
                name="national_id"
                placeholder="National ID Number"
                value={formData.national_id}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <small>7 or 8 digit Kenyan National ID number</small>
            </div>

            <div className="form-group">
              <label htmlFor="loan_type">Select Loan Type</label>
              <select
                id="loan_type"
                name="loan_type"
                value={formData.loan_type}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="" disabled>
                  Select Loan Type
                </option>
                <option value="business">Business Loan</option>
                <option value="personal">Personal Loan</option>
                <option value="education">Education Loan</option>
                <option value="medical">Medical Loan</option>
                <option value="emergency">Emergency Loan</option>
              </select>
              <small>Choose the purpose of your loan</small>
            </div>

            <div className="secure-row">
              <span>🔒 Secure</span>
              <span>🛡️ Licensed</span>
              <span>✅ No CRB Check</span>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Checking Eligibility...' : 'Check Eligibility'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>

            <p className="footnote">No paperwork required. No guarantors needed.</p>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Eligibility;

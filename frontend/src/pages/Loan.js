// Loan.js - Loan Application Page
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loanService } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Loan.css';

const Loan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentIndex, setRecentIndex] = useState(0);
  const applyButtonRef = useRef(null);

  const recentLoans = [
    { phone: '0712****34', amount: '13,200', time: '9 mins ago' },
    { phone: '0798****87', amount: '25,600', time: '14 mins ago' },
    { phone: '0743****21', amount: '9,800', time: '21 mins ago' },
    { phone: '0725****56', amount: '48,600', time: '33 mins ago' },
    { phone: '0767****09', amount: '16,800', time: '41 mins ago' },
    { phone: '0711****72', amount: '30,000', time: '52 mins ago' },
    { phone: '0756****45', amount: '7,800', time: '1 hr ago' },
    { phone: '0700****18', amount: '44,200', time: '1 hr 10 mins ago' },
    { phone: '0714****23', amount: '21,200', time: '1 hr 15 mins ago' },
    { phone: '0789****56', amount: '35,400', time: '1 hr 22 mins ago' },
    { phone: '0745****89', amount: '11,200', time: '1 hr 30 mins ago' },
    { phone: '0722****04', amount: '39,800', time: '1 hr 38 mins ago' },
    { phone: '0768****67', amount: '5,500', time: '1 hr 45 mins ago' },
    { phone: '0717****32', amount: '25,600', time: '1 hr 52 mins ago' },
    { phone: '0751****91', amount: '48,600', time: '2 hrs ago' },
    { phone: '0703****15', amount: '16,800', time: '2 hrs 5 mins ago' },
    { phone: '0721****48', amount: '30,000', time: '2 hrs 12 mins ago' },
    { phone: '0779****73', amount: '9,800', time: '2 hrs 18 mins ago' },
    { phone: '0741****62', amount: '44,200', time: '2 hrs 25 mins ago' },
    { phone: '0713****29', amount: '21,200', time: '2 hrs 32 mins ago' },
    { phone: '0762****84', amount: '7,800', time: '2 hrs 40 mins ago' },
    { phone: '0719****17', amount: '35,400', time: '2 hrs 47 mins ago' },
    { phone: '0754****50', amount: '13,200', time: '2 hrs 54 mins ago' },
    { phone: '0707****96', amount: '39,800', time: '3 hrs ago' },
    { phone: '0726****61', amount: '25,600', time: '3 hrs 8 mins ago' },
    { phone: '0785****33', amount: '48,600', time: '3 hrs 15 mins ago' },
    { phone: '0738****78', amount: '11,200', time: '3 hrs 22 mins ago' },
    { phone: '0715****45', amount: '30,000', time: '3 hrs 30 mins ago' },
    { phone: '0773****99', amount: '16,800', time: '3 hrs 37 mins ago' },
    { phone: '0704****22', amount: '5,500', time: '3 hrs 44 mins ago' },
    { phone: '0728****66', amount: '21,200', time: '3 hrs 52 mins ago' },
    { phone: '0758****11', amount: '44,200', time: '3 hrs 59 mins ago' },
    { phone: '0711****88', amount: '9,800', time: '4 hrs ago' },
    { phone: '0765****55', amount: '35,400', time: '4 hrs 7 mins ago' },
    { phone: '0741****74', amount: '25,600', time: '4 hrs 15 mins ago' },
    { phone: '0717****39', amount: '13,200', time: '4 hrs 22 mins ago' },
    { phone: '0788****02', amount: '39,800', time: '4 hrs 30 mins ago' },
    { phone: '0722****67', amount: '48,600', time: '4 hrs 37 mins ago' },
    { phone: '0754****44', amount: '7,800', time: '4 hrs 44 mins ago' },
    { phone: '0709****31', amount: '30,000', time: '4 hrs 52 mins ago' },
    { phone: '0735****58', amount: '16,800', time: '4 hrs 59 mins ago' },
    { phone: '0776****97', amount: '21,200', time: '5 hrs ago' },
    { phone: '0712****80', amount: '11,200', time: '5 hrs 8 mins ago' },
    { phone: '0746****13', amount: '44,200', time: '5 hrs 15 mins ago' },
    { phone: '0720****86', amount: '9,800', time: '5 hrs 22 mins ago' },
    { phone: '0781****24', amount: '35,400', time: '5 hrs 30 mins ago' },
    { phone: '0753****77', amount: '25,600', time: '5 hrs 37 mins ago' },
    { phone: '0708****42', amount: '13,200', time: '5 hrs 44 mins ago' },
    { phone: '0763****65', amount: '39,800', time: '5 hrs 52 mins ago' },
    { phone: '0718****09', amount: '48,600', time: '6 hrs ago' },
    { phone: '0734****72', amount: '5,500', time: '6 hrs 7 mins ago' },
    { phone: '0790****36', amount: '30,000', time: '6 hrs 15 mins ago' },
    { phone: '0714****51', amount: '16,800', time: '6 hrs 22 mins ago' },
    { phone: '0757****18', amount: '21,200', time: '6 hrs 30 mins ago' },
    { phone: '0703****93', amount: '7,800', time: '6 hrs 37 mins ago' },
    { phone: '0771****40', amount: '44,200', time: '6 hrs 44 mins ago' },
    { phone: '0725****70', amount: '11,200', time: '6 hrs 52 mins ago' },
    { phone: '0741****35', amount: '9,800', time: '7 hrs ago' },
    { phone: '0786****82', amount: '35,400', time: '7 hrs 8 mins ago' },
    { phone: '0716****47', amount: '25,600', time: '7 hrs 15 mins ago' },
    { phone: '0750****69', amount: '13,200', time: '7 hrs 22 mins ago' },
    { phone: '0706****14', amount: '39,800', time: '7 hrs 30 mins ago' },
    { phone: '0768****53', amount: '48,600', time: '7 hrs 37 mins ago' },
    { phone: '0719****26', amount: '5,500', time: '7 hrs 44 mins ago' },
    { phone: '0744****91', amount: '30,000', time: '7 hrs 52 mins ago' },
    { phone: '0782****64', amount: '16,800', time: '8 hrs ago' },
    { phone: '0712****19', amount: '21,200', time: '8 hrs 7 mins ago' },
    { phone: '0758****41', amount: '44,200', time: '8 hrs 15 mins ago' },
    { phone: '0721****87', amount: '7,800', time: '8 hrs 22 mins ago' },
    { phone: '0773****12', amount: '11,200', time: '8 hrs 30 mins ago' },
    { phone: '0746****37', amount: '9,800', time: '8 hrs 37 mins ago' },
    { phone: '0710****75', amount: '35,400', time: '8 hrs 44 mins ago' },
    { phone: '0789****58', amount: '25,600', time: '8 hrs 52 mins ago' },
    { phone: '0735****03', amount: '13,200', time: '9 hrs ago' },
    { phone: '0764****66', amount: '39,800', time: '9 hrs 8 mins ago' },
    { phone: '0715****28', amount: '48,600', time: '9 hrs 15 mins ago' },
    { phone: '0754****34', amount: '5,500', time: '9 hrs 22 mins ago' },
    { phone: '0707****89', amount: '30,000', time: '9 hrs 30 mins ago' },
    { phone: '0761****45', amount: '16,800', time: '9 hrs 37 mins ago' },
    { phone: '0718****72', amount: '21,200', time: '9 hrs 44 mins ago' },
    { phone: '0743****11', amount: '44,200', time: '9 hrs 52 mins ago' },
    { phone: '0796****56', amount: '7,800', time: '10 hrs ago' },
    { phone: '0722****99', amount: '11,200', time: '10 hrs 8 mins ago' },
    { phone: '0750****22', amount: '9,800', time: '10 hrs 15 mins ago' },
    { phone: '0778****84', amount: '35,400', time: '10 hrs 22 mins ago' },
    { phone: '0741****17', amount: '25,600', time: '10 hrs 30 mins ago' },
    { phone: '0710****63', amount: '13,200', time: '10 hrs 37 mins ago' },
    { phone: '0767****40', amount: '39,800', time: '10 hrs 44 mins ago' },
    { phone: '0712****95', amount: '48,600', time: '10 hrs 52 mins ago' },
    { phone: '0754****21', amount: '5,500', time: '11 hrs ago' },
    { phone: '0725****68', amount: '30,000', time: '11 hrs 8 mins ago' },
    { phone: '0788****34', amount: '16,800', time: '11 hrs 15 mins ago' },
    { phone: '0719****77', amount: '21,200', time: '11 hrs 22 mins ago' },
    { phone: '0744****50', amount: '44,200', time: '11 hrs 30 mins ago' },
    { phone: '0709****92', amount: '7,800', time: '11 hrs 37 mins ago' },
    { phone: '0763****46', amount: '11,200', time: '11 hrs 44 mins ago' },
    { phone: '0716****61', amount: '9,800', time: '11 hrs 52 mins ago' },
  ];

  const [loanOptions] = useState([
    { amount: 5500, fee: 100, days: 60 },
    { amount: 7800, fee: 130, days: 60 },
    { amount: 9800, fee: 160, days: 60 },
    { amount: 11200, fee: 200, days: 60 },
    { amount: 16800, fee: 230, days: 60 },
    { amount: 21200, fee: 270, days: 60 },
    { amount: 25600, fee: 400, days: 60 },
    { amount: 30000, fee: 470, days: 60 },
    { amount: 35400, fee: 590, days: 60 },
    { amount: 39800, fee: 730, days: 60 },
    { amount: 44200, fee: 1010, days: 60 },
    { amount: 48600, fee: 1600, days: 60 },
  ]);

  useEffect(() => {
    if (!user?.phone_number) {
      navigate('/eligibility');
    }
  }, [user, navigate]);

  useEffect(() => {
    document.title = 'Loan Options | Tala Mkopo Extra';
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRecentIndex(prev => (prev + 1) % recentLoans.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [recentLoans.length]);

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    setTimeout(() => {
      applyButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const handleApply = async () => {
    if (!selectedLoan) {
      Swal.fire('Error', 'Please select a loan amount', 'error');
      return;
    }

    setLoading(true);

    try {
      // Show payment modal
      const { value: confirmed } = await Swal.fire({
        title: 'Confirm Loan Application',
        html: `
          <div style="text-align: left;">
            <p><strong>Loan Amount:</strong> ${formatCurrency(selectedLoan.amount)}</p>
            <p><strong>Processing Fee:</strong> ${formatCurrency(selectedLoan.fee)}</p>
            <p><strong>Term:</strong> 2 months at 10% interest</p>
            <p style="font-size: 0.9rem; color: #666; margin-top: 1rem;">
              You will be charged Ksh ${selectedLoan.fee} as processing fee via M-Pesa
            </p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Proceed to Payment',
        cancelButtonText: 'Cancel',
      });

      if (!confirmed) {
        setLoading(false);
        return;
      }

      // Initiate STK Push
      const result = await loanService.initiateStkPush(
        user.phone_number,
        selectedLoan.fee
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to initiate payment');
      }

      // Show STK push waiting screen
      Swal.fire({
        title: 'Check Your Phone',
        html: `
          <div style="text-align: center;">
            <i class="fas fa-mobile-alt" style="font-size: 48px; color: #26c2a3; margin-bottom: 16px;"></i>
            <p>Enter your M-Pesa PIN on your phone</p>
            <p style="font-size: 0.9rem; color: #666; margin-top: 8px;">Amount: ${formatCurrency(selectedLoan.fee)}</p>
            <div style="margin-top: 16px; padding: 12px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bfdbfe;">
              <p style="font-size: 0.85rem; margin: 0; color: #1d4ed8;">Waiting for payment confirmation...</p>
            </div>
          </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
      });

      // Poll for payment status
      let attempts = 0;
      const maxAttempts = 20;
      const pollInterval = setInterval(async () => {
        attempts++;

        try {
          const statusResult = await loanService.checkPaymentStatus(
            result.reference
          );

          if (statusResult.success) {
            clearInterval(pollInterval);

            Swal.fire({
              icon: 'success',
              title: 'Payment Successful!',
              html: `<p>Your loan of <strong>${formatCurrency(selectedLoan.amount)}</strong> has been approved!</p>`,
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              navigate('/dashboard');
            });
          } else if (statusResult.status === 'failed' || statusResult.status === 'cancelled') {
            clearInterval(pollInterval);
            Swal.fire(
              'Payment Not Completed',
              statusResult.resultDescription || 'M-Pesa payment was not completed. Please try again.',
              'warning'
            );
            setLoading(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            Swal.fire(
              'Timeout',
              'Payment confirmation timeout. Please check your account.',
              'info'
            );
            setLoading(false);
          }
        } catch (error) {
          clearInterval(pollInterval);
          Swal.fire('Error', 'Failed to check payment status', 'error');
          setLoading(false);
        }
      }, 3000);
    } catch (error) {
      Swal.fire('Error', error.message || 'Failed to apply for loan', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="container apply-page-wrap">
      <Header logoInitial="P" />

      <div className="apply-container">
        <div className="loan-content card">
          <h1>Loan Options</h1>

          <p className="apply-subtitle">
            Get the financial support you need with our simple, transparent loan process
          </p>

          <div className="apply-pill-row">
            <span>🔒 256-bit Encryption</span>
            <span>⚡ Instant Decisions</span>
            <span>⭐ 4.8/5 Rating</span>
          </div>

          <div className="qualification-box">
            Hi <strong>{user?.name || 'Customer'}</strong>, you qualify for these loan options based on your
            <strong> M-Pesa records</strong> (2-month term at 10% interest).
          </div>

          <div className="recent-loans-box">
            <h3>📢 Recent Loans</h3>
            <p key={recentIndex} className="recent-loan-ticker">
              {recentLoans[recentIndex].phone} received Ksh{recentLoans[recentIndex].amount} - {recentLoans[recentIndex].time}
            </p>
          </div>

          <div className="amounts-panel">
            <h2>Select Your Loan Amount</h2>
            <div className="loan-grid">
              {loanOptions.map((loan, index) => (
                <div
                  key={index}
                  className={`loan-option ${selectedLoan?.amount === loan.amount ? 'selected' : ''}`}
                  onClick={() => handleSelectLoan(loan)}
                >
                  <div className="loan-amount">Ksh {loan.amount.toLocaleString()}</div>
                  <div className="processing-fee">Fee: Ksh {loan.fee.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="fee-note">
            <p>
              💡 Higher loan amounts have slightly higher processing fees. Your selected processing fee will be deducted
              from your loan disbursement after payment confirmation.
            </p>
          </div>

          <button
            ref={applyButtonRef}
            className="btn-primary apply-now-btn"
            onClick={handleApply}
            disabled={!selectedLoan || loading}
          >
            {loading ? 'Processing...' : 'Get Loan Now'}
            {!loading && (
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
            )}
          </button>

          <Link to="/" className="back-home-link">
            ← Back to Home
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Loan;

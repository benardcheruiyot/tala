import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Processing.css';

const messages = [
  'Initializing secure connection...',
  'Verifying your details...',
  'Checking eligibility status...',
  'Preparing your loan options...',
  'Finalizing application review...',
  'Completing final calculations...',
];

const Processing = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    document.title = 'Processing | Tala Mkopo Extra';
  }, []);

  const step = useMemo(() => {
    const maxIndex = messages.length - 1;
    const nextStep = Math.floor((progress / 100) * maxIndex);
    return Math.min(nextStep, maxIndex);
  }, [progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + 1;
      });
    }, 115);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (progress === 100 && !showResult) {
      setShowResult(true);
    }
  }, [progress, showResult]);

  useEffect(() => {
    if (!showResult) {
      return;
    }

    const done = setTimeout(() => {
      navigate('/loan');
    }, 5200);

    return () => clearTimeout(done);
  }, [navigate, showResult]);

  return (
    <div className="container processing-page">
      <Header logoInitial="P" />

      <div className="processing-card card">
        <div className="processing-badge">🔐 Secure Processing</div>

        <h2>Processing Your Application</h2>

        <div className="ssl-chip">✓ 256-bit SSL Encryption</div>

        <div className="processing-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>

        {!showResult && <p className="processing-message">{messages[step]}</p>}

        <div className="progress-head">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="processing-grid">
          <div>🏦 CBK Licensed</div>
          <div>⏱️ Instant Approval</div>
          <div>🔐 Data Protected</div>
          <div>💳 No Hidden Fees</div>
        </div>

        {showResult && (
          <div className="processing-result">
            <div className="processing-result-check">✓</div>
            <p>Eligibility successful. You qualify for a loan.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Processing;

// App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './styles/globals.css';

// Pages
import Home from './pages/Home';
import Eligibility from './pages/Eligibility';
import Loan from './pages/Loan';
import Dashboard from './pages/Dashboard';
import Processing from './pages/Processing';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/eligibility" element={<Eligibility />} />

          <Route
            path="/processing"
            element={
              <ProtectedRoute>
                <Processing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/loanapproval"
            element={
              <ProtectedRoute>
                <Processing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/loan"
            element={
              <ProtectedRoute>
                <Loan />
              </ProtectedRoute>
            }
          />

          <Route
            path="/apply"
            element={
              <ProtectedRoute>
                <Loan />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

// Routes
const express = require('express');
const userController = require('../controllers/userController');
const loanController = require('../controllers/loanController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/auth/register', userController.registerOrLogin);

// Protected routes
router.get('/user/profile', protect, userController.getProfile);
router.put('/user/profile', protect, userController.updateProfile);

// Loan routes
router.post('/loans/apply', protect, loanController.createApplication);
router.get('/loans', protect, loanController.getUserLoans);
router.get('/loans/:loanId', protect, loanController.getLoan);

// Payment routes
router.post('/stk_push', protect, loanController.initiateStkPush);
router.get('/check_status', protect, loanController.checkPaymentStatus);
router.post('/mpesa/callback', loanController.handleMpesaCallback);

module.exports = router;

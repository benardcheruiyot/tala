// Loan Controller
const Loan = require('../models/Loan');
const loanService = require('../services/loanService');
const mpesaService = require('../services/mpesaService');
const { AppError } = require('../middleware/errorHandler');

class LoanController {
  async createApplication(req, res, next) {
    try {
      const { amount, termDays } = req.body;

      if (!amount) {
        return next(new AppError('Loan amount is required', 400));
      }

      // Validate amount
      loanService.validateLoanAmount(amount);

      const processingFee = parseInt(process.env.PROCESSING_FEE || 300);

      const loan = await loanService.createLoanApplication(req.user.id, {
        amount,
        processingFee,
        termDays: termDays || 30,
      });

      res.status(201).json({
        success: true,
        data: loan,
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async getLoan(req, res, next) {
    try {
      const { loanId } = req.params;
      const loan = await Loan.findById(loanId);

      if (!loan) {
        return next(new AppError('Loan not found', 404));
      }

      if (loan.userId !== req.user.id) {
        return next(new AppError('Not authorized to access this loan', 403));
      }

      res.status(200).json({
        success: true,
        data: loan,
      });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }

  async getUserLoans(req, res, next) {
    try {
      const loans = await Loan.findByUserId(req.user.id);

      res.status(200).json({
        success: true,
        data: loans,
      });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }

  async initiateStkPush(req, res, next) {
    try {
      const { phone, amount } = req.body;

      if (!phone || !amount) {
        return next(new AppError('Phone number and amount are required', 400));
      }

      const result = await mpesaService.initiateStkPush(phone, amount);

      if (!result.success) {
        return next(new AppError(result.message, 400));
      }

      res.status(200).json({
        success: true,
        reference: result.checkoutRequestId,
      });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }

  async checkPaymentStatus(req, res, next) {
    try {
      const { checkoutId } = req.query;

      if (!checkoutId) {
        return next(new AppError('Checkout ID is required', 400));
      }

      const result = await mpesaService.checkTransactionStatus(checkoutId);

      res.status(200).json({
        success: result.success,
        status: result.status,
      });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }

  async handleMpesaCallback(req, res, next) {
    try {
      const { Body } = req.body;

      if (!Body || !Body.stkCallback) {
        return res.status(400).json({
          success: false,
          message: 'Invalid callback data',
        });
      }

      const { CheckoutRequestID, ResultCode } = Body.stkCallback;

      // ResultCode 0 = Success
      if (ResultCode === 0) {
        console.log(`✅ Payment successful for request: ${CheckoutRequestID}`);
        // Store callback data, approve loan, etc.
      } else {
        console.log(`❌ Payment failed for request: ${CheckoutRequestID}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }
}

module.exports = new LoanController();

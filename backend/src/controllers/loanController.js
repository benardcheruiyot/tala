// Loan Controller
const Loan = require('../models/Loan');
const MpesaTransaction = require('../models/MpesaTransaction');
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

      await MpesaTransaction.create({
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        phone,
        amount,
        status: 'initiated',
        rawResponse: result.rawResponse || null,
      });

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

      const existingTransaction = await MpesaTransaction.findByCheckoutRequestId(checkoutId);
      if (existingTransaction?.status === 'expired') {
        return res.status(200).json({
          success: false,
          status: 'expired',
          resultCode: existingTransaction.resultCode || 'TIMEOUT',
          resultDescription:
            existingTransaction.resultDescription ||
            'Transaction expired after 5 minutes without confirmation.',
        });
      }

      const result = await mpesaService.checkTransactionStatus(checkoutId);

      const normalizedStatus =
        result.status === 'pending' && existingTransaction
          ? (await MpesaTransaction.findByCheckoutRequestId(checkoutId))?.status || result.status
          : result.status;

      await MpesaTransaction.updateByCheckoutRequestId(checkoutId, {
        status: normalizedStatus,
        resultCode: result.resultCode || null,
        resultDescription: result.resultDescription || null,
      });

      res.status(200).json({
        success: normalizedStatus === 'completed',
        status: normalizedStatus,
        resultCode: result.resultCode,
        resultDescription:
          normalizedStatus === 'expired'
            ? 'Transaction expired after 5 minutes without confirmation.'
            : result.resultDescription,
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

      const { CheckoutRequestID, MerchantRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
      const metadata = CallbackMetadata?.Item || [];

      const getMetaValue = (name) => metadata.find((item) => item.Name === name)?.Value;
      const receiptNumber = getMetaValue('MpesaReceiptNumber') || null;

      const normalizedStatus =
        ResultCode === 0
          ? 'completed'
          : ResultCode === 1032
            ? 'cancelled'
            : 'failed';

      await MpesaTransaction.updateByCheckoutRequestId(CheckoutRequestID, {
        merchantRequestId: MerchantRequestID || null,
        status: normalizedStatus,
        resultCode: String(ResultCode),
        resultDescription: ResultDesc || null,
        mpesaReceiptNumber: receiptNumber,
        callbackData: Body.stkCallback,
      });

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

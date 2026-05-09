// Loan Controller
const Loan = require('../models/Loan');
const MpesaTransaction = require('../models/MpesaTransaction');
const loanService = require('../services/loanService');
const mpesaService = require('../services/mpesaService');
const { AppError } = require('../middleware/errorHandler');

class LoanController {
  inferLoanAmountFromFee(processingFee) {
    const feeToLoanMap = {
      100: 5500,
      130: 7800,
      160: 9800,
      200: 11200,
      230: 16800,
      270: 21200,
      400: 25600,
      470: 30000,
      590: 35400,
      730: 39800,
      1010: 44200,
      1600: 48600,
    };

    return feeToLoanMap[Number(processingFee)] || null;
  }

  async ensureLoanCreatedForCompletedTransaction(checkoutRequestId) {
    if (!checkoutRequestId) return null;

    const transaction = await MpesaTransaction.findByCheckoutRequestId(checkoutRequestId);
    if (!transaction || transaction.status !== 'completed' || transaction.loanId) {
      return transaction;
    }

    if (!transaction.userId || !transaction.loanAmount) {
      return transaction;
    }

    const loan = await loanService.createLoanApplication(transaction.userId, {
      amount: Number(transaction.loanAmount),
      processingFee: Number(transaction.amount),
      termDays: Number(transaction.termDays) || 60,
    });

    await MpesaTransaction.updateByCheckoutRequestId(checkoutRequestId, {
      loanId: loan.id,
      loanCreatedAt: new Date(),
    });

    return MpesaTransaction.findByCheckoutRequestId(checkoutRequestId);
  }

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
      const { phone, amount, loanAmount, termDays } = req.body;

      if (!phone || !amount) {
        return next(new AppError('Phone number and amount are required', 400));
      }

      const resolvedLoanAmount = Number(loanAmount) || this.inferLoanAmountFromFee(amount);
      if (resolvedLoanAmount) {
        loanService.validateLoanAmount(Number(resolvedLoanAmount));
      }

      const result = await mpesaService.initiateStkPush(phone, amount);

      if (!result.success) {
        return next(new AppError(result.message, 400));
      }

      await MpesaTransaction.create({
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        userId: req.user.id,
        phone,
        amount,
        loanAmount: resolvedLoanAmount,
        termDays: termDays || 60,
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

      console.log(`[Payment Status] Checking status for checkoutId: ${checkoutId}`);

      const existingTransaction = await MpesaTransaction.findByCheckoutRequestId(checkoutId);
      console.log(`[Payment Status] Transaction found:`, existingTransaction ? 'yes' : 'no', existingTransaction?.status);
      
      if (existingTransaction?.userId && existingTransaction.userId !== req.user.id) {
        return next(new AppError('Not authorized to access this transaction', 403));
      }

      const terminalStatuses = ['completed', 'failed', 'cancelled', 'expired'];

      // Prefer callback-confirmed terminal state to avoid losing a successful payment
      // when an STK query response is delayed or temporarily inconsistent.
      if (existingTransaction && terminalStatuses.includes(existingTransaction.status)) {
        console.log(`[Payment Status] Transaction already in terminal state: ${existingTransaction.status}`);
        const finalizedTransaction =
          existingTransaction.status === 'completed'
            ? await this.ensureLoanCreatedForCompletedTransaction(checkoutId)
            : existingTransaction;

        return res.status(200).json({
          success: finalizedTransaction.status === 'completed',
          status: finalizedTransaction.status,
          resultCode: finalizedTransaction.resultCode || null,
          resultDescription: finalizedTransaction.resultDescription || null,
          loanId: finalizedTransaction.loanId || null,
        });
      }

      console.log(`[Payment Status] Querying M-Pesa API for transaction status...`);
      const result = await mpesaService.checkTransactionStatus(checkoutId);
      console.log(`[Payment Status] M-Pesa query result:`, result.status);

      const refreshedTransaction = await MpesaTransaction.findByCheckoutRequestId(checkoutId);
      const fallbackStatus = refreshedTransaction?.status || existingTransaction?.status || 'pending';
      const normalizedStatus = result.status || fallbackStatus;

      console.log(`[Payment Status] Updating transaction status to:`, normalizedStatus);
      await MpesaTransaction.updateByCheckoutRequestId(checkoutId, {
        status: normalizedStatus,
        resultCode: result.resultCode || null,
        resultDescription: result.resultDescription || null,
      });

      const finalizedTransaction =
        normalizedStatus === 'completed'
          ? await this.ensureLoanCreatedForCompletedTransaction(checkoutId)
          : await MpesaTransaction.findByCheckoutRequestId(checkoutId);

      res.status(200).json({
        success: normalizedStatus === 'completed',
        status: normalizedStatus,
        resultCode: result.resultCode || refreshedTransaction?.resultCode || null,
        resultDescription:
          normalizedStatus === 'expired'
            ? 'Transaction expired after 5 minutes without confirmation.'
            : result.resultDescription || refreshedTransaction?.resultDescription || null,
        loanId: finalizedTransaction?.loanId || null,
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
        await this.ensureLoanCreatedForCompletedTransaction(CheckoutRequestID);
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

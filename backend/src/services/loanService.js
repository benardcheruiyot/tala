// Loan Service
const Loan = require('../models/Loan');
const User = require('../models/User');

class LoanService {
  async createLoanApplication(userId, loanData) {
    try {
      const loan = await Loan.create({
        userId,
        amount: loanData.amount,
        processingFee: loanData.processingFee,
        interestRate: parseFloat(process.env.LOAN_INTEREST_RATE || 0.1),
        termDays: loanData.termDays || 30,
        status: 'pending',
      });

      return loan;
    } catch (error) {
      throw new Error(`Failed to create loan application: ${error.message}`);
    }
  }

  async getLoanDetails(loanId) {
    return await Loan.findById(loanId);
  }

  async getUserLoans(userId) {
    return await Loan.findByUserId(userId);
  }

  calculateRepaymentAmount(principal, interestRate) {
    return principal + principal * interestRate;
  }

  validateLoanAmount(amount) {
    const minAmount = parseInt(process.env.LOAN_MIN_AMOUNT || 1000);
    const maxAmount = parseInt(process.env.LOAN_MAX_AMOUNT || 100000);

    if (amount < minAmount || amount > maxAmount) {
      throw new Error(
        `Loan amount must be between Ksh ${minAmount} and Ksh ${maxAmount}`
      );
    }
  }

  async approveLoan(loanId, mpesaReference) {
    try {
      const loan = await Loan.updateStatus(loanId, 'approved', mpesaReference);
      return loan;
    } catch (error) {
      throw new Error(`Failed to approve loan: ${error.message}`);
    }
  }
}

module.exports = new LoanService();

const transactions = new Map();

class MpesaTransaction {
  constructor(data) {
    this.id = data.id;
    this.checkoutRequestId = data.checkoutRequestId || null;
    this.merchantRequestId = data.merchantRequestId || null;
    this.phone = data.phone || null;
    this.amount = data.amount || null;
    this.accountReference = data.accountReference || null;
    this.status = data.status || 'initiated';
    this.resultCode = data.resultCode || null;
    this.resultDescription = data.resultDescription || null;
    this.mpesaReceiptNumber = data.mpesaReceiptNumber || null;
    this.callbackData = data.callbackData || null;
    this.rawRequest = data.rawRequest || null;
    this.rawResponse = data.rawResponse || null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.completedAt = null;
  }

  static async create(data) {
    const transaction = new MpesaTransaction({
      ...data,
      id: `MPESA-${Date.now()}`,
    });

    transactions.set(transaction.checkoutRequestId, transaction);
    return transaction;
  }

  static async findByCheckoutRequestId(checkoutRequestId) {
    if (!checkoutRequestId) return null;
    return transactions.get(checkoutRequestId) || null;
  }

  static async updateByCheckoutRequestId(checkoutRequestId, patch) {
    const transaction = await MpesaTransaction.findByCheckoutRequestId(checkoutRequestId);
    if (!transaction) return null;

    Object.assign(transaction, patch);
    transaction.updatedAt = new Date();

    if (patch.status && ['completed', 'failed', 'cancelled'].includes(patch.status)) {
      transaction.completedAt = new Date();
    }

    return transaction;
  }
}

module.exports = MpesaTransaction;
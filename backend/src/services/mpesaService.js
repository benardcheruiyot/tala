// M-Pesa Service
const axios = require('axios');

class MpesaService {
  constructor() {
    this.consumerKey = String(process.env.MPESA_CONSUMER_KEY || '').trim();
    this.consumerSecret = String(process.env.MPESA_CONSUMER_SECRET || '').trim();
    this.environment = String(process.env.MPESA_ENVIRONMENT || 'production').trim();
    this.shortcode = String(process.env.MPESA_SHORTCODE || '').trim();
    this.partyB = String(process.env.MPESA_PARTYB || this.shortcode).trim();
    this.businessCode = String(this.partyB || this.shortcode).trim();
    this.passkey = String(process.env.MPESA_PASSKEY || '').trim();
    this.transactionType = String(process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline').trim();
    
    // Log M-Pesa configuration status
    this.isConfigured = this.isProperlyConfigured();
    if (!this.isConfigured) {
      console.warn('[M-Pesa] ⚠️  M-Pesa is running in DEVELOPMENT MODE');
      console.warn('[M-Pesa] Set real credentials in .env to enable production');
    } else {
      console.log(`[M-Pesa] ✅ M-Pesa is configured for ${this.environment}`);
    }
  }

  isProperlyConfigured() {
    const hasKeys = Boolean(this.consumerKey && this.consumerSecret);
    const hasBusinessCode = Boolean(this.businessCode);
    const hasPasskey = Boolean(this.passkey);

    return hasKeys && hasBusinessCode && hasPasskey && this.environment === 'production';
  }

  getBaseUrl() {
    return 'https://api.safaricom.co.ke';
  }

  normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');

    if (digits.startsWith('254') && digits.length === 12) {
      return digits;
    }

    if (digits.startsWith('0') && digits.length === 10) {
      return `254${digits.slice(1)}`;
    }

    if (digits.length === 9 && digits.startsWith('7')) {
      return `254${digits}`;
    }

    return digits;
  }

  async getAccessToken() {
    try {
      const auth = Buffer.from(
        `${this.consumerKey}:${this.consumerSecret}`
      ).toString('base64');

      const response = await axios.get(
        `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
          timeout: 20000,
        }
      );

      return response.data.access_token;
    } catch (error) {
      const apiData = error.response?.data;
      const statusCode = error.response?.status;

      console.error('[M-Pesa OAuth] Failed to get access token');
      console.error('[M-Pesa OAuth] Environment:', this.environment);
      console.error('[M-Pesa OAuth] Status:', statusCode || 'no-response');
      console.error('[M-Pesa OAuth] Message:', error.message);
      if (apiData) {
        console.error('[M-Pesa OAuth] API error:', apiData);
      }

      if (error.code === 'ECONNABORTED' || !error.response) {
        throw new Error(
          'Cannot reach Safaricom OAuth endpoint from this server/network. Check outbound internet/firewall and try again.'
        );
      }

      if (statusCode === 401 || statusCode === 403 || statusCode === 400) {
        throw new Error('M-Pesa OAuth rejected credentials. Confirm Consumer Key/Secret and environment.');
      }

      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  async initiateStkPush(phone, amount) {
    try {
      const normalizedPhone = this.normalizePhone(phone);

      if (this.environment !== 'production') {
        throw new Error('M-Pesa is configured for production only. Set MPESA_ENVIRONMENT=production.');
      }

      console.log(`[M-Pesa STK] Initiating STK push for ${normalizedPhone} (${this.environment})`);

      const accessToken = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, -3);

      const password = Buffer.from(
        `${this.businessCode}${this.passkey}${timestamp}`
      ).toString('base64');

      const callbackUrl = String(process.env.MPESA_CALLBACK_URL || '').trim();

      const payload = {
        BusinessShortCode: this.businessCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: this.transactionType,
        Amount: amount,
        PartyA: normalizedPhone,
        PartyB: this.partyB,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `LoanApp-${Date.now()}`,
        TransactionDesc: 'Loan Processing Fee',
      };

      console.log('[M-Pesa STK] Request payload:', payload);

      const response = await axios.post(
        `${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log('[M-Pesa STK] Response:', response.data);

      if (response.data.ResponseCode !== '0') {
        throw new Error(response.data.ResponseDescription);
      }

      return {
        checkoutRequestId: response.data.CheckoutRequestID,
        success: true,
      };
    } catch (error) {
      const apiError = error.response?.data;
      console.error('[M-Pesa STK] ❌ STK FAILED');
      console.error('[M-Pesa STK] Error message:', error.message);
      console.error('[M-Pesa STK] Full API error:', JSON.stringify(apiError, null, 2));
      console.error('[M-Pesa STK] Status code:', error.response?.status);

      // DO NOT HIDE ERRORS - Show them so the user knows what's wrong
      return {
        success: false,
        message: apiError?.errorMessage || apiError?.ResponseDescription || error.message,
        errorCode: apiError?.errorCode,
        fullError: apiError,
      };
    }
  }

  async checkTransactionStatus(checkoutRequestId) {
    try {
      if (this.environment !== 'production') {
        throw new Error('M-Pesa is configured for production only. Set MPESA_ENVIRONMENT=production.');
      }

      console.log(`[M-Pesa Status] Checking transaction status for ${checkoutRequestId}`);

      const accessToken = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, -3);

      const password = Buffer.from(
        `${this.businessCode}${this.passkey}${timestamp}`
      ).toString('base64');

      const payload = {
        BusinessShortCode: this.businessCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await axios.post(
        `${this.getBaseUrl()}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log('[M-Pesa Status] Response:', response.data);

      const isSuccess = response.data.ResultCode === '0';

      return {
        success: isSuccess,
        status: isSuccess ? 'completed' : 'pending',
        resultCode: response.data.ResultCode,
        resultDescription: response.data.ResultDesc,
        mpesaReference: response.data.MerchantRequestID,
      };
    } catch (error) {
      console.error('[M-Pesa Status] Error:', error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

module.exports = new MpesaService();

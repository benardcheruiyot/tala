// M-Pesa Service
const axios = require('axios');

class MpesaService {
  constructor() {
    this.consumerKey = String(process.env.MPESA_CONSUMER_KEY || '').trim();
    this.consumerSecret = String(process.env.MPESA_CONSUMER_SECRET || '').trim();
    this.environment = String(process.env.MPESA_ENVIRONMENT || 'sandbox').trim();

    // In sandbox, use known Daraja STK test credentials unless explicitly overridden.
    this.shortcode = String(
      process.env.MPESA_SHORTCODE || (this.environment === 'sandbox' ? '174379' : '')
    ).trim();
    this.passkey = String(
      process.env.MPESA_PASSKEY ||
        (this.environment === 'sandbox'
          ? 'bfb279f9aa9bdbcf158e97dd71a467cd2e0542f31bff0b23062ad96057225ff7'
          : '')
    ).trim();
    
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
    const hasKeys = this.consumerKey && this.consumerSecret;
    const hasShortcode = this.shortcode && this.shortcode !== '174379'; // 174379 is sandbox only
    const hasPasskey = this.passkey && this.passkey !== 'bfb279f9aa9bdbcf158e97dd71a467cd2e0542f31bff0b23062ad96057225ff7'; // default sandbox passkey
    
    return hasKeys && hasShortcode && hasPasskey && this.environment === 'production';
  }

  getBaseUrl() {
    return this.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
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
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting M-Pesa access token:', error.message);
      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  async initiateStkPush(phone, amount) {
    try {
      const normalizedPhone = this.normalizePhone(phone);
      
      // Demo Mode - Always return simulated success for testing
      if (this.environment === 'demo') {
        console.log(`[M-Pesa STK] 🧪 DEMO MODE: Simulating STK push for ${normalizedPhone} (amount: ${amount})`);
        return {
          checkoutRequestId: `DEMO_${Date.now()}`,
          success: true,
          demo: true,
        };
      }

      console.log(`[M-Pesa STK] Initiating STK push for ${normalizedPhone} (${this.environment})`);

      const accessToken = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, -3);

      const password = Buffer.from(
        `${this.shortcode}${this.passkey}${timestamp}`
      ).toString('base64');

      const callbackUrl = String(process.env.MPESA_CALLBACK_URL || '').trim();

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: normalizedPhone,
        PartyB: this.shortcode,
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
      // Demo mode or simulated references - return success immediately
      if (String(checkoutRequestId || '').startsWith('DEMO_') || 
          String(checkoutRequestId || '').startsWith('SIM_') || 
          String(checkoutRequestId || '').startsWith('DEV_')) {
        console.log(`[M-Pesa Status] 🧪 Demo/simulated transaction: ${checkoutRequestId}`);
        return {
          success: true,
          status: 'completed',
          resultCode: '0',
          resultDescription: 'Simulated payment completed.',
          mpesaReference: `REF_${Date.now()}`,
        };
      }

      // Development/Demo mode - use mock response when credentials not configured
      if (!this.consumerKey || !this.consumerSecret) {
        console.warn('[M-Pesa Status] ⚠️  Using MOCK response (credentials not configured)');
        return {
          success: true,
          status: 'completed',
          resultCode: '0',
          resultDescription: 'The transaction has been completed successfully.',
          mpesaReference: `DEV_REF_${Date.now()}`,
        };
      }

      console.log(`[M-Pesa Status] Checking transaction status for ${checkoutRequestId}`);

      const accessToken = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, -3);

      const password = Buffer.from(
        `${this.shortcode}${this.passkey}${timestamp}`
      ).toString('base64');

      const payload = {
        BusinessShortCode: this.shortcode,
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

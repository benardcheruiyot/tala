// M-Pesa Service
const https = require('https');

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
    this.httpsAgent = new https.Agent({ family: 4, keepAlive: false });
    
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

  async requestJson(method, path, { headers = {}, body, timeout = 20000 } = {}) {
    const url = new URL(`${this.getBaseUrl()}${path}`);

    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const request = https.request(
        url,
        {
          method,
          agent: this.httpsAgent,
          family: 4,
          headers: {
            Accept: 'application/json',
            ...headers,
            ...(payload
              ? {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(payload),
                }
              : {}),
          },
        },
        (response) => {
          let raw = '';

          response.on('data', (chunk) => {
            raw += chunk;
          });

          response.on('end', () => {
            let data = raw;

            try {
              data = raw ? JSON.parse(raw) : {};
            } catch {
              data = raw;
            }

            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(data);
              return;
            }

            reject({
              response: {
                status: response.statusCode,
                data,
              },
              message: typeof data === 'string' ? data : data?.errorMessage || data?.ResponseDescription || `Request failed with status ${response.statusCode}`,
            });
          });
        }
      );

      request.setTimeout(timeout, () => {
        request.destroy(Object.assign(new Error(`timeout of ${timeout}ms exceeded`), { code: 'ECONNABORTED' }));
      });

      request.on('error', (error) => {
        reject(error);
      });

      if (payload) {
        request.write(payload);
      }

      request.end();
    });
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
    const auth = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`
    ).toString('base64');

    let lastError;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await this.requestJson(
          'GET',
          '/oauth/v1/generate?grant_type=client_credentials',
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
            timeout: 20000,
          }
        );

        return response.access_token;
      } catch (error) {
        lastError = error;
        const apiData = error.response?.data;
        const statusCode = error.response?.status;

        console.error('[M-Pesa OAuth] Failed to get access token');
        console.error('[M-Pesa OAuth] Attempt:', attempt);
        console.error('[M-Pesa OAuth] Environment:', this.environment);
        console.error('[M-Pesa OAuth] Status:', statusCode || 'no-response');
        console.error('[M-Pesa OAuth] Code:', error.code || 'n/a');
        console.error('[M-Pesa OAuth] Message:', error.message);
        if (apiData) {
          console.error('[M-Pesa OAuth] API error:', apiData);
        }

        if (statusCode === 401 || statusCode === 403 || statusCode === 400) {
          throw new Error('M-Pesa OAuth rejected credentials. Confirm Consumer Key/Secret and environment.');
        }

        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }
    }

    if (lastError?.code === 'ECONNABORTED' || !lastError?.response) {
      throw new Error(
        'Temporary connection issue while reaching Safaricom OAuth. Please try again in a moment.'
      );
    }

    throw new Error('Failed to authenticate with M-Pesa');
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

      const response = await this.requestJson(
        'POST',
        '/mpesa/stkpush/v1/processrequest',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: payload,
        }
      );

      console.log('[M-Pesa STK] Response:', response);

      if (response.ResponseCode !== '0') {
        throw new Error(response.ResponseDescription);
      }

      return {
        checkoutRequestId: response.CheckoutRequestID,
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

      const response = await this.requestJson(
        'POST',
        '/mpesa/stkpushquery/v1/query',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: payload,
        }
      );

      console.log('[M-Pesa Status] Response:', response);

      const isSuccess = response.ResultCode === '0';

      return {
        success: isSuccess,
        status: isSuccess ? 'completed' : 'pending',
        resultCode: response.ResultCode,
        resultDescription: response.ResultDesc,
        mpesaReference: response.MerchantRequestID,
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

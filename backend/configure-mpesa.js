#!/usr/bin/env node

/**
 * M-Pesa Configuration Helper
 * Interactive script to set up M-Pesa credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function main() {
  console.log('\n🚀 M-Pesa Configuration Setup\n');
  console.log('This script will help you configure M-Pesa credentials.\n');

  const mode = await question(
    'Are you setting up for [s]andbox testing or [p]roduction? (s/p): '
  );

  if (mode.toLowerCase() === 's') {
    setupSandbox();
  } else if (mode.toLowerCase() === 'p') {
    await setupProduction();
  } else {
    console.log('Invalid option. Exiting...');
    process.exit(1);
  }
}

function setupSandbox() {
  console.log('\n📋 Sandbox Configuration (Testing)\n');
  console.log('For sandbox testing, use these default Safaricom test credentials:\n');

  const sandboxConfig = {
    MPESA_CONSUMER_KEY: 'dpF1Z27gVQzjLEw0LHk8PQIAVeqH7V5z',
    MPESA_CONSUMER_SECRET: 'l6PwbM2qK8RpQxY0',
    MPESA_SHORTCODE: '174379',
    MPESA_PASSKEY: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0542f31bff0b23062ad96057225ff7',
    MPESA_ENVIRONMENT: 'sandbox',
  };

  console.log('MPESA_CONSUMER_KEY:', sandboxConfig.MPESA_CONSUMER_KEY);
  console.log('MPESA_CONSUMER_SECRET:', sandboxConfig.MPESA_CONSUMER_SECRET);
  console.log('MPESA_SHORTCODE:', sandboxConfig.MPESA_SHORTCODE);
  console.log('MPESA_PASSKEY:', sandboxConfig.MPESA_PASSKEY);
  console.log('MPESA_ENVIRONMENT:', sandboxConfig.MPESA_ENVIRONMENT);

  console.log(
    '\n✅ Sandbox credentials are already configured in .env\n'
  );
  console.log('Test Phone Numbers (for sandbox):');
  console.log('  - 254712345678 (or 0712345678 with country code)');
  console.log('  - 254723456789 (or 0723456789 with country code)\n');
  console.log('Reference: https://developer.safaricom.co.ke/\n');

  rl.close();
}

async function setupProduction() {
  console.log('\n🔐 Production Configuration\n');
  console.log('⚠️  IMPORTANT: This will update your .env file with production credentials\n');

  const envPath = path.join(__dirname, '.env');

  const consumerKey = await question(
    'Enter your MPESA_CONSUMER_KEY (from Daraja): '
  );
  const consumerSecret = await question(
    'Enter your MPESA_CONSUMER_SECRET (from Daraja): '
  );
  const shortcode = await question('Enter your MPESA_SHORTCODE (business shortcode): ');
  const passkey = await question('Enter your MPESA_PASSKEY (from M-Pesa Portal): ');
  const callbackUrl = await question(
    'Enter your MPESA_CALLBACK_URL (e.g., https://yourdomain.com/api/mpesa/callback): '
  );
  const frontendUrl = await question(
    'Enter your FRONTEND_URL (e.g., https://yourdomain.com): '
  );
  const mongoUri = await question(
    'Enter your MONGODB_URI (MongoDB Atlas connection string): '
  );

  // Generate JWT secret
  const crypto = require('crypto');
  const jwtSecret = crypto.randomBytes(32).toString('hex');

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update environment variables
  envContent = updateEnvVar(envContent, 'NODE_ENV', 'production');
  envContent = updateEnvVar(envContent, 'MPESA_ENVIRONMENT', 'production');
  envContent = updateEnvVar(envContent, 'MPESA_CONSUMER_KEY', consumerKey);
  envContent = updateEnvVar(envContent, 'MPESA_CONSUMER_SECRET', consumerSecret);
  envContent = updateEnvVar(envContent, 'MPESA_SHORTCODE', shortcode);
  envContent = updateEnvVar(envContent, 'MPESA_PASSKEY', passkey);
  envContent = updateEnvVar(envContent, 'MPESA_CALLBACK_URL', callbackUrl);
  envContent = updateEnvVar(envContent, 'FRONTEND_URL', frontendUrl);
  envContent = updateEnvVar(envContent, 'MONGODB_URI', mongoUri);
  envContent = updateEnvVar(envContent, 'JWT_SECRET', jwtSecret);

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Production configuration saved to .env\n');
  console.log('Next steps:');
  console.log('1. Restart your backend server');
  console.log('2. Test payment flow');
  console.log('3. Monitor M-Pesa Portal for transactions\n');

  rl.close();
}

function updateEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
}

main().catch(console.error);

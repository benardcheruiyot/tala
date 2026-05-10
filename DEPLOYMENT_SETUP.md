# Production Deployment Setup Guide

This guide explains how to automatically deploy the app to production with the correct environment configuration.

## Overview

- **Development**: Uses `.env` with `NODE_ENV=development` (allows all CORS origins locally)
- **Production**: Uses GitHub Actions secrets to create `.env` on deploy (restricted CORS to tala.mkopaji.com)

## Required GitHub Secrets

You need to add these secrets to your GitHub repository settings at:
`https://github.com/benardcheruiyot/tala/settings/secrets/actions`

### Deployment Access Secrets
- `VPS_SSH_KEY` - SSH private key for accessing the VPS server

### Production Environment Secrets

**JWT & Auth:**
- `PROD_JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**M-Pesa Configuration:**
- `PROD_MPESA_CONSUMER_KEY` - From Safaricom Daraja
- `PROD_MPESA_CONSUMER_SECRET` - From Safaricom Daraja
- `PROD_MPESA_SHORTCODE` - Your M-Pesa business shortcode
- `PROD_MPESA_PARTYB` - Your M-Pesa party B ID
- `PROD_MPESA_PASSKEY` - M-Pesa passkey for STK Push

**Web Push (VAPID):**
- `PROD_VAPID_PUBLIC_KEY` - Generated using web-push CLI
- `PROD_VAPID_PRIVATE_KEY` - Generated using web-push CLI

## How to Generate VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

This will output:
```
Public Key: ...
Private Key: ...
```

## How to Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step-by-Step Setup

### 1. Generate Required Secrets

```bash
# Generate JWT Secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate VAPID Keys (install if needed: npm install -g web-push)
web-push generate-vapid-keys
```

### 2. Add Secrets to GitHub

1. Go to: https://github.com/benardcheruiyot/tala/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret with the names listed above (e.g., `PROD_JWT_SECRET`)

### 3. Verify Deployment Workflow

The workflow will:
1. ✅ Create `.env` file using GitHub secrets
2. ✅ Deploy code to VPS
3. ✅ Install dependencies
4. ✅ Build frontend
5. ✅ Restart backend with pm2
6. ✅ Configure Nginx & SSL

### 4. Push to Deploy

```bash
git push origin master
```

The GitHub Actions workflow will automatically:
- Create production environment file
- Deploy to your VPS
- Restart the application
- Reload Nginx

## Production CORS Configuration

In production mode, CORS is restricted to:
- `https://tala.mkopaji.com`

This is enforced by the backend CORS middleware when `NODE_ENV=production`.

## Local Development

For local development, the `.env` file is already configured:
- `NODE_ENV=development`
- `PORT=5000`
- CORS allows all origins

```bash
# Run locally
cd backend && npm run dev
cd frontend && npm start
```

## Troubleshooting

### Deployment fails with "Script not found"

Make sure the backend directory is set correctly in the deployment script.

### CORS errors in production

Ensure the frontend is being served from `https://tala.mkopaji.com` (not a different domain).

### Environment variables not loading

Check GitHub Actions secrets are set correctly with exact names (case-sensitive).

## Security Notes

- ✅ Secrets are stored in GitHub (never committed to repo)
- ✅ `.env` files are in `.gitignore`
- ✅ Production uses restricted CORS (not open to all origins)
- ✅ Development uses development mode locally

Never commit `.env` files or real secrets to Git!

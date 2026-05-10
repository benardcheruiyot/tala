# 🚀 Quick Start - Automated Deployment Setup

This guide will get your app automatically deploying to production in 2 minutes.

## Prerequisites

1. **GitHub CLI installed and authenticated**
   ```bash
   # Install: https://cli.github.com/
   # Authenticate:
   gh auth login
   ```

2. **Have your M-Pesa & VAPID credentials ready**
   - M-Pesa: Consumer Key, Secret, Shortcode, Party B, Passkey
   - VAPID Keys: Can generate with `web-push generate-vapid-keys`
   - VPS SSH Key: The private key file for your server

## One-Click Setup (Windows)

```powershell
# From PowerShell in the project directory:
.\setup-secrets.ps1
```

Follow the interactive prompts and enter your production credentials.

## One-Click Setup (macOS/Linux)

```bash
# From Terminal in the project directory:
bash setup-secrets.sh
```

Follow the interactive prompts and enter your production credentials.

## What The Script Does

✅ Generates a secure JWT_SECRET automatically
✅ Prompts you for M-Pesa credentials
✅ Prompts you for Web Push VAPID keys  
✅ Prompts you for VPS SSH key
✅ Adds all secrets to GitHub Actions
✅ Validates each secret was added

## Manual Setup (No Script)

If you prefer, go to: 
**https://github.com/benardcheruiyot/tala/settings/secrets/actions**

Add these secrets:
- `PROD_JWT_SECRET`
- `PROD_MPESA_CONSUMER_KEY`
- `PROD_MPESA_CONSUMER_SECRET`
- `PROD_MPESA_SHORTCODE`
- `PROD_MPESA_PARTYB`
- `PROD_MPESA_PASSKEY`
- `PROD_VAPID_PUBLIC_KEY`
- `PROD_VAPID_PRIVATE_KEY`
- `VPS_SSH_KEY`

## After Setup

```bash
# Just push to deploy!
git push origin master
```

Your GitHub Actions workflow will automatically:
1. Build the frontend
2. Build the backend  
3. Deploy to your VPS
4. Restart the services
5. Configure Nginx & SSL

## Monitor Deployment

Watch real-time deployment:
**https://github.com/benardcheruiyot/tala/actions**

Your app will be live at: **https://tala.mkopaji.com**

## Troubleshooting

**"gh command not found"**
- Install GitHub CLI: https://cli.github.com/

**"Not authenticated"**
- Run: `gh auth login`

**Deployment fails**
- Check GitHub Actions logs for errors
- Verify all secrets are set correctly
- SSH into VPS and check logs: `pm2 logs tala-backend`

## That's it! 🎉

Every time you push to `master`, it will automatically:
- Deploy to production
- Restart your backend
- Update your frontend
- Configure SSL certificates

Happy coding!

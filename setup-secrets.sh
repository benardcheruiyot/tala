#!/bin/bash

# GitHub Actions Secrets Setup Script
# This script automatically adds all required production secrets to your GitHub repository
# Prerequisites: GitHub CLI (gh) installed and authenticated

set -e

echo "🚀 Tala Mkopo Extra - GitHub Actions Secrets Setup"
echo "=================================================="
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

REPO="benardcheruiyot/tala"
echo "📦 Repository: $REPO"
echo ""

# Generate JWT Secret
echo "🔑 Generating secrets..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)
echo "✓ JWT_SECRET generated"

echo ""
echo "📋 Required M-Pesa & VAPID Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You need to provide the following values:"
echo "  1. PROD_MPESA_CONSUMER_KEY - From Safaricom Daraja"
echo "  2. PROD_MPESA_CONSUMER_SECRET - From Safaricom Daraja"
echo "  3. PROD_MPESA_SHORTCODE - Your M-Pesa business code"
echo "  4. PROD_MPESA_PARTYB - Your M-Pesa Party B ID"
echo "  5. PROD_MPESA_PASSKEY - M-Pesa STK Push passkey"
echo "  6. PROD_VAPID_PUBLIC_KEY - From: web-push generate-vapid-keys"
echo "  7. PROD_VAPID_PRIVATE_KEY - From: web-push generate-vapid-keys"
echo ""

# Function to read secret interactively
read_secret() {
    local prompt="$1"
    local var_name="$2"
    local default="${3:-}"
    
    if [ -n "$default" ]; then
        echo -n "$prompt [$default]: "
    else
        echo -n "$prompt: "
    fi
    
    read -sr value
    echo ""
    
    if [ -z "$value" ] && [ -n "$default" ]; then
        eval "$var_name=$default"
    else
        eval "$var_name=$value"
    fi
}

# Read M-Pesa secrets
echo "Enter your M-Pesa Daraja credentials (from: https://developer.safaricom.co.ke/)"
read_secret "MPESA_CONSUMER_KEY" "MPESA_CONSUMER_KEY"
read_secret "MPESA_CONSUMER_SECRET" "MPESA_CONSUMER_SECRET"
read_secret "MPESA_SHORTCODE" "MPESA_SHORTCODE"
read_secret "MPESA_PARTYB" "MPESA_PARTYB"
read_secret "MPESA_PASSKEY" "MPESA_PASSKEY"

echo ""
echo "Enter your Web Push VAPID keys"
echo "(Generate with: npm install -g web-push && web-push generate-vapid-keys)"
read_secret "VAPID_PUBLIC_KEY" "VAPID_PUBLIC_KEY"
read_secret "VAPID_PRIVATE_KEY" "VAPID_PRIVATE_KEY"

echo ""
echo "Enter your VPS SSH private key path (or paste the key content)"
read_secret "VPS_SSH_KEY path or content" "VPS_SSH_KEY_INPUT"

# Handle SSH key (could be file path or content)
if [ -f "$VPS_SSH_KEY_INPUT" ]; then
    VPS_SSH_KEY=$(cat "$VPS_SSH_KEY_INPUT")
else
    VPS_SSH_KEY="$VPS_SSH_KEY_INPUT"
fi

echo ""
echo "📤 Adding secrets to GitHub..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Add all secrets
gh secret set PROD_JWT_SECRET --body "$JWT_SECRET" -R "$REPO" && echo "✓ PROD_JWT_SECRET"
gh secret set PROD_MPESA_CONSUMER_KEY --body "$MPESA_CONSUMER_KEY" -R "$REPO" && echo "✓ PROD_MPESA_CONSUMER_KEY"
gh secret set PROD_MPESA_CONSUMER_SECRET --body "$MPESA_CONSUMER_SECRET" -R "$REPO" && echo "✓ PROD_MPESA_CONSUMER_SECRET"
gh secret set PROD_MPESA_SHORTCODE --body "$MPESA_SHORTCODE" -R "$REPO" && echo "✓ PROD_MPESA_SHORTCODE"
gh secret set PROD_MPESA_PARTYB --body "$MPESA_PARTYB" -R "$REPO" && echo "✓ PROD_MPESA_PARTYB"
gh secret set PROD_MPESA_PASSKEY --body "$MPESA_PASSKEY" -R "$REPO" && echo "✓ PROD_MPESA_PASSKEY"
gh secret set PROD_VAPID_PUBLIC_KEY --body "$VAPID_PUBLIC_KEY" -R "$REPO" && echo "✓ PROD_VAPID_PUBLIC_KEY"
gh secret set PROD_VAPID_PRIVATE_KEY --body "$VAPID_PRIVATE_KEY" -R "$REPO" && echo "✓ PROD_VAPID_PRIVATE_KEY"
gh secret set VPS_SSH_KEY --body "$VPS_SSH_KEY" -R "$REPO" && echo "✓ VPS_SSH_KEY"

echo ""
echo "✅ All secrets added successfully!"
echo ""
echo "🚀 Next steps:"
echo "  1. Run: git push origin master"
echo "  2. Watch the deployment at: https://github.com/benardcheruiyot/tala/actions"
echo "  3. Your app will be live at: https://tala.mkopaji.com"
echo ""

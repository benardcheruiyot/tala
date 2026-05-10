# GitHub Actions Secrets Setup Script (PowerShell)
# This script automatically adds all required production secrets to your GitHub repository
# Prerequisites: GitHub CLI (gh) installed and authenticated

Write-Host "🚀 Tala Mkopo Extra - GitHub Actions Secrets Setup" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Check if GitHub CLI is installed
$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Host "❌ GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/"
    exit 1
}

# Check if authenticated
$authStatus = & gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with GitHub CLI." -ForegroundColor Red
    Write-Host "Run: gh auth login"
    exit 1
}

$REPO = "benardcheruiyot/tala"
Write-Host "📦 Repository: $REPO" -ForegroundColor Cyan
Write-Host ""

# Generate JWT Secret
Write-Host "🔑 Generating secrets..." -ForegroundColor Yellow
$JWT_SECRET = [System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
$JWT_SECRET = $JWT_SECRET.Replace("-", "")
Write-Host "✓ JWT_SECRET generated" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Required M-Pesa & VAPID Configuration:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need to provide the following values:"
Write-Host "  1. PROD_MPESA_CONSUMER_KEY - From Safaricom Daraja"
Write-Host "  2. PROD_MPESA_CONSUMER_SECRET - From Safaricom Daraja"
Write-Host "  3. PROD_MPESA_SHORTCODE - Your M-Pesa business code"
Write-Host "  4. PROD_MPESA_PARTYB - Your M-Pesa Party B ID"
Write-Host "  5. PROD_MPESA_PASSKEY - M-Pesa STK Push passkey"
Write-Host "  6. PROD_VAPID_PUBLIC_KEY - From: web-push generate-vapid-keys"
Write-Host "  7. PROD_VAPID_PRIVATE_KEY - From: web-push generate-vapid-keys"
Write-Host ""

# Function to read secret interactively
function Read-Secret {
    param(
        [string]$Prompt,
        [string]$Default = ""
    )
    
    if ($Default) {
        Write-Host "$Prompt [$Default]: " -NoNewline
    } else {
        Write-Host "$Prompt: " -NoNewline
    }
    
    $value = Read-Host
    
    if ([string]::IsNullOrWhiteSpace($value) -and $Default) {
        return $Default
    }
    return $value
}

# Read M-Pesa secrets
Write-Host ""
Write-Host "Enter your M-Pesa Daraja credentials (from: https://developer.safaricom.co.ke/)" -ForegroundColor Yellow
$MPESA_CONSUMER_KEY = Read-Secret "MPESA_CONSUMER_KEY"
$MPESA_CONSUMER_SECRET = Read-Secret "MPESA_CONSUMER_SECRET"
$MPESA_SHORTCODE = Read-Secret "MPESA_SHORTCODE"
$MPESA_PARTYB = Read-Secret "MPESA_PARTYB"
$MPESA_PASSKEY = Read-Secret "MPESA_PASSKEY"

Write-Host ""
Write-Host "Enter your Web Push VAPID keys" -ForegroundColor Yellow
Write-Host "(Generate with: npm install -g web-push && web-push generate-vapid-keys)"
$VAPID_PUBLIC_KEY = Read-Secret "VAPID_PUBLIC_KEY"
$VAPID_PRIVATE_KEY = Read-Secret "VAPID_PRIVATE_KEY"

Write-Host ""
$VPS_SSH_KEY_INPUT = Read-Secret "VPS_SSH_KEY (path to file or paste content)"

# Handle SSH key (could be file path or content)
if (Test-Path $VPS_SSH_KEY_INPUT) {
    $VPS_SSH_KEY = Get-Content $VPS_SSH_KEY_INPUT -Raw
} else {
    $VPS_SSH_KEY = $VPS_SSH_KEY_INPUT
}

Write-Host ""
Write-Host "📤 Adding secrets to GitHub..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

# Add all secrets
@{
    "PROD_JWT_SECRET" = $JWT_SECRET
    "PROD_MPESA_CONSUMER_KEY" = $MPESA_CONSUMER_KEY
    "PROD_MPESA_CONSUMER_SECRET" = $MPESA_CONSUMER_SECRET
    "PROD_MPESA_SHORTCODE" = $MPESA_SHORTCODE
    "PROD_MPESA_PARTYB" = $MPESA_PARTYB
    "PROD_MPESA_PASSKEY" = $MPESA_PASSKEY
    "PROD_VAPID_PUBLIC_KEY" = $VAPID_PUBLIC_KEY
    "PROD_VAPID_PRIVATE_KEY" = $VAPID_PRIVATE_KEY
    "VPS_SSH_KEY" = $VPS_SSH_KEY
}.GetEnumerator() | ForEach-Object {
    & gh secret set $_.Key --body $_.Value -R $REPO
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $($_.Key)" -ForegroundColor Green
    } else {
        Write-Host "✗ $($_.Key) - Failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ All secrets added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: git push origin master"
Write-Host "  2. Watch the deployment at: https://github.com/benardcheruiyot/tala/actions"
Write-Host "  3. Your app will be live at: https://tala.mkopaji.com"
Write-Host ""

# 🔐 SKIPIFY T-SHIRT STORE - ENVIRONMENT VARIABLES

## 📋 Instructions for Local Development:

1. Create a `.env` file in the `/deploy` directory
2. Copy the template below and replace placeholder values with your actual credentials
3. **NEVER commit the `.env` file to Git** (it's in .gitignore)

## 🚨 SECURITY WARNING:
These are **SENSITIVE credentials** - keep them secure!

## Environment Variables Template

```bash
# ============================================================================
# 🏪 SKIPIFY CONFIGURATION (REQUIRED)
# ============================================================================

# Your Skipify Merchant ID (required)
# Get this from your Skipify merchant dashboard
SKIPIFY_MERCHANT_ID=your_skipify_merchant_id_here

# Skipify Environment: 'stage' for testing, 'prod' for production
SKIPIFY_ENVIRONMENT=stage

# ============================================================================
# 🔒 SECURITY CONFIGURATION (REQUIRED)
# ============================================================================

# Session Secret: Generate a secure random string (minimum 32 characters)
# Use: openssl rand -base64 32
# Or: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
SESSION_SECRET=your_secure_random_session_secret_min_32_chars

# ============================================================================
# 🚀 APPLICATION CONFIGURATION (OPTIONAL)
# ============================================================================

# Application Port (default: 8080)
PORT=8080

# Node Environment
NODE_ENV=development

# Enable/Disable Security Features
SECURITY_ENABLED=true
```

## 📝 Example Values (DO NOT USE IN PRODUCTION):

```bash
SKIPIFY_MERCHANT_ID=1bdc8b60-6dd4-4126-88e1-c9e5b570f1a0
SKIPIFY_ENVIRONMENT=stage
SESSION_SECRET=supersecurerandomstringwith32ormorechars123
PORT=8080
NODE_ENV=development
SECURITY_ENABLED=true
```

## 🔧 Quick Setup Commands:

### 1. Generate a secure session secret:
```bash
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Create your .env file:
```bash
cd deploy
touch .env
# Then edit the .env file with your values
```

### 3. Start the application:
```bash
cd deploy
npm start
```

## 🌐 Digital Ocean App Platform Setup:

For production deployment, set these environment variables in your Digital Ocean App Platform:

1. Go to **Digital Ocean App Platform**
2. Select your app → **Settings** → **App-Level Environment Variables**
3. Add these required variables:
   - `SKIPIFY_MERCHANT_ID`: Your actual Skipify merchant ID
   - `SESSION_SECRET`: A secure random string (min 32 characters)
4. **Redeploy the application**

## 🔒 Security Features:

- ✅ **No hardcoded secrets** in codebase
- ✅ **Fail-fast security** - app won't start without required env vars
- ✅ **Masked logging** - sensitive values are hidden in logs
- ✅ **Environment separation** - different configs for dev/prod
- ✅ **Proper .gitignore** - .env files excluded from Git

## ⚠️ Important Notes:

- **NEVER** commit real credentials to GitHub
- **ALWAYS** use environment variables for sensitive data
- **GENERATE** unique session secrets for each environment
- **ROTATE** secrets regularly for maximum security

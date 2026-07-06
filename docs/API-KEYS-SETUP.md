# API Keys Setup Guide for Kuntur

Complete guide to configure all API keys required for Kuntur Threat Intelligence platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [AbuseIPDB Setup](#abuseipdb-setup)
4. [GreyNoise Setup](#greynoise-setup)
5. [OTX AlienVault Setup](#otx-alienvault-setup)
6. [Shodan Setup](#shodan-setup)
7. [Configure .env File](#configure-env-file)
8. [Verify API Keys](#verify-api-keys)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Kuntur requires API keys from multiple threat intelligence sources:

| Service | Free Tier Limit | Purpose |
|---------|----------------|---------|
| **AbuseIPDB** | 1,000 requests/day | IP reputation reporting |
| **GreyNoise** | 25 requests/week | Internet background noise detection |
| **OTX AlienVault** | 1,200 requests/hour | Threat intelligence data |
| **Shodan** | 100 requests/month | Internet-connected device search |

---

## Prerequisites

Before starting, ensure you have:

- Active GitHub account (for some services)
- Active email account
- `/Users/manuellazarteascuy/Documents/proyectoWayra_temp/kuntur/.env` file created

---

## AbuseIPDB Setup

**Free Tier:** 1,000 requests per day
**Registration URL:** https://abuseipdb.com/register

### Step-by-Step Instructions

1. **Go to Registration Page**
   ```bash
   # Open in browser
   open https://abuseipdb.com/register
   ```

2. **Create Account**
   - Enter your email address
   - Choose a strong password
   - Complete the reCAPTCHA verification
   - Click "Sign Up"

3. **Verify Email**
   - Check your inbox for verification email
   - Click the verification link

4. **Get API Key**
   ```bash
   # Login and navigate to:
   # Dashboard → API Key
   ```

5. **Copy API Key**
   - Your key format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

## GreyNoise Setup

**Free Tier:** 25 requests per week (Community)
**Registration URL:** https://greynoise.io/signup

### Step-by-Step Instructions

1. **Go to Registration Page**
   ```bash
   # Open in browser
   open https://greynoise.io/signup
   ```

2. **Choose Community Plan**
   - Select "Community" (free tier)
   - Click "Sign Up"

3. **Create Account**
   - Enter your email and password
   - Or sign up with Google/GitHub

4. **Get API Key**
   ```bash
   # After login:
   # Navigate to: Dashboard → API Keys
   ```

5. **Copy API Key**
   - Your key format: `gno_xxxxxxxxxxxxx`

---

## OTX AlienVault Setup

**Free Tier:** 1,200 requests per hour
**Registration URL:** https://otx.alienvault.com/signup

### Step-by-Step Instructions

1. **Go to Registration Page**
   ```bash
   # Open in browser
   open https://otx.alienvault.com/signup
   ```

2. **Create Account**
   - Enter your email
   - Create username and password
   - Click "Create Account"

3. **Verify Email**
   - Check your inbox for verification link

4. **Get API Key**
   ```bash
   # After login:
   # Navigate to: Settings → API Key
   ```

5. **Copy API Key**
   - Your key format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

---

## Shodan Setup

**Free Tier:** 100 requests per month
**Registration URL:** https://account.shodan.io/register

### Step-by-Step Instructions

1. **Go to Registration Page**
   ```bash
   # Open in browser
   open https://account.shodan.io/register
   ```

2. **Create Account**
   - Enter your email
   - Create password
   - Click "Create Account"

3. **Verify Email**
   - Check your inbox for verification link

4. **Get API Key**
   ```bash
   # After login:
   # Navigate to: https://developer.shodan.io/api
   ```

5. **Copy API Key**
   - Your key format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

---

## Configure .env File

### Step 1: Create/Edit .env File

```bash
# Navigate to project directory
cd /Users/manuellazarteascuy/Documents/proyectoWayra_temp/kuntur

# Create .env file if it doesn't exist
touch .env
```

### Step 2: Add API Keys

Copy and paste the following into your `.env` file, replacing the placeholder values:

```env
# Kuntur Environment Variables

# AbuseIPDB API Key (1,000 requests/day - Free)
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here

# GreyNoise API Key (25 requests/week - Community)
GREYNOISE_API_KEY=your_greynoise_api_key_here

# OTX AlienVault API Key (1,200 requests/hour - Free)
OTX_API_KEY=your_otx_api_key_here

# Shodan API Key (100 requests/month - Free)
SHODAN_API_KEY=your_shodan_api_key_here
```

### Step 3: Replace Placeholders

Replace each `your_*_api_key_here` with your actual API keys:

```env
# Example with real keys (replace these!)
ABUSEIPDB_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
GREYNOISE_API_KEY=gno_xxxxxxxxxxxxx
OTX_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
SHODAN_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

### Step 4: Save and Secure

```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore

# Set proper permissions (read/write for owner only)
chmod 600 .env
```

---

## Verify API Keys

### Quick Verification Commands

Run these commands from your project directory to verify each API key:

#### 1. Verify AbuseIPDB

```bash
# From project root
curl -G "https://api.abuseipdb.com/api/v2/check" \
  --data-urlencode "ipAddress=8.8.8.8" \
  -d "maxAgeInDays=90" \
  -d "verbose" \
  -H "Key: $ABUSEIPDB_API_KEY" \
  -H "Accept: application/json"
```

**Expected Response:** JSON with IP information

#### 2. Verify GreyNoise

```bash
# Test GreyNoise API
curl "https://api.greynoise.io/v3/community/8.8.8.8" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $GREYNOISE_API_KEY"
```

**Expected Response:** JSON with noise status

#### 3. Verify OTX AlienVault

```bash
# Test OTX API
curl "https://otx.alienvault.com/api/v1/indicators/IPv4/8.8.8.8/general" \
  -H "X-OTX-API-Key: $OTX_API_KEY"
```

**Expected Response:** JSON with threat intelligence data

#### 4. Verify Shodan

```bash
# Test Shodan API
curl "https://api.shodan.io/shodan/host/8.8.8.8?key=$SHODAN_API_KEY"
```

**Expected Response:** JSON with host information

### Python Verification Script

Alternatively, use this Python script to verify all keys:

```python
#!/usr/bin/env python3
"""
Verify Kuntur API Keys
Run this script from the kuntur directory
"""

import os
import sys
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

def check_abuseipdb():
    """Verify AbuseIPDB API key"""
    try:
        response = requests.get(
            "https://api.abuseipdb.com/api/v2/check",
            params={"ipAddress": "8.8.8.8", "maxAgeInDays": 90, "verbose": ""},
            headers={"Key": os.getenv("ABUSEIPDB_API_KEY"), "Accept": "application/json"}
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def check_greynoise():
    """Verify GreyNoise API key"""
    try:
        response = requests.get(
            "https://api.greynoise.io/v3/community/8.8.8.8",
            headers={
                "Authorization": f"Bearer {os.getenv('GREYNOISE_API_KEY')}",
                "Accept": "application/json"
            }
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def check_otx():
    """Verify OTX API key"""
    try:
        response = requests.get(
            "https://otx.alienvault.com/api/v1/indicators/IPv4/8.8.8.8/general",
            headers={"X-OTX-API-Key": os.getenv("OTX_API_KEY")}
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def check_shodan():
    """Verify Shodan API key"""
    try:
        response = requests.get(
            f"https://api.shodan.io/shodan/host/8.8.8.8?key={os.getenv('SHODAN_API_KEY')}"
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all checks"""
    print("Verifying Kuntur API Keys...\n")

    checks = [
        ("AbuseIPDB", check_abuseipdb),
        ("GreyNoise", check_greynoise),
        ("OTX AlienVault", check_otx),
        ("Shodan", check_shodan)
    ]

    results = []
    for service, check_func in checks:
        print(f"Checking {service}...", end=" ")
        result = check_func()
        results.append((service, result))
        print("✓ OK" if result else "✗ FAILED")

    print(f"\nResults: {sum(1 for _, r in results if r)}/{len(results)} passed")
    
    if all(r for _, r in results):
        print("All API keys verified successfully!")
        return 0
    else:
        print("Some API keys failed verification. Please check your .env file.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

**To run the verification script:**

```bash
cd /Users/manuellazarteascuy/Documents/proyectoWayra_temp/kuntur
python3 verify_api_keys.py
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "API Key Not Found" Error

**Problem:** Environment variables not being loaded.

**Solution:**

```bash
# Check if .env file exists
ls -la .env

# Verify .env file contents
cat .env

# Ensure you're loading the .env file in your Python code:
from dotenv import load_dotenv
load_dotenv()
```

#### Issue 2: "Invalid API Key" Error

**Problem:** API key is incorrect or expired.

**Solution:**

1. Double-check the API key in your `.env` file
2. Ensure no extra spaces or characters:
   ```bash
   # Remove any leading/trailing spaces
   sed -i '' 's/ABUSEIPDB_API_KEY= */ABUSEIPDB_API_KEY=/' .env
   ```
3. Regenerate API key from the service dashboard if needed

#### Issue 3: "Rate Limit Exceeded"

**Problem:** Exceeded free tier limits.

**Solution:**

| Service | Free Tier Limit | Wait Time |
|---------|----------------|-----------|
| AbuseIPDB | 1,000/day | Until next day |
| GreyNoise | 25/week | 7 days |
| OTX | 1,200/hour | 1 hour |
| Shodan | 100/month | Next month |

#### Issue 4: Module Import Errors

**Problem:** Missing Python dependencies.

**Solution:**

```bash
# Install required packages
pip install python-dotenv requests
```

#### Issue 5: Shell Variables Not Loading

**Problem:** Environment variables not available in shell.

**Solution:**

```bash
# For bash/zsh - add to ~/.zshrc or ~/.bashrc
export $(cat .env | grep -v '^#' | xargs)

# Or use direnv (recommended)
brew install direnv
echo 'dotenv' > .envrc
direnv allow
```

#### Issue 6: GitHub Actions / CI Environment

**Problem:** API keys not available in CI/CD.

**Solution:**

```bash
# Add secrets to GitHub
gh secret set ABUSEIPDB_API_KEY
gh secret set GREYNOISE_API_KEY
gh secret set OTX_API_KEY
gh secret set SHODAN_API_KEY

# Verify secrets
gh secret list
```

---

## Additional Resources

### Service Documentation

- **AbuseIPDB API Docs:** https://abuseipdb.com/api
- **GreyNoise API Docs:** https://docs.greynoise.io/
- **OTX API Docs:** https://otx.alienvault.com/api
- **Shodan API Docs:** https://developer.shodan.io/api

### Support Contacts

- **AbuseIPDB:** support@abuseipdb.com
- **GreyNoise:** support@greynoise.io
- **OTX:** support@alienvault.com
- **Shodan:** support@shodan.io

---

## Security Best Practices

1. **Never commit .env to version control**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Rotate API keys regularly**
   - Every 90 days for production
   - Immediately if compromised

3. **Use separate keys for dev/prod**
   - Create different API keys for different environments

4. **Monitor API usage**
   - Check dashboards regularly
   - Set up alerts for rate limits

5. **Store securely in CI/CD**
   - Use encrypted secrets
   - Never hardcode in scripts

---

## Quick Reference

### All Registration Links

```bash
# Quick-open all registration pages
open https://abuseipdb.com/register
open https://greynoise.io/signup
open https://otx.alienvault.com/signup
open https://account.shodan.io/register
```

### API Dashboard Links

```bash
# Quick-open all API dashboards
open https://abuseipdb.com/api
open https://greynoise.io/api
open https://otx.alienvault.com/api
open https://developer.shodan.io/api
```

---

**Last Updated:** 2026-07-05
**Kuntur Version:** 1.0.0

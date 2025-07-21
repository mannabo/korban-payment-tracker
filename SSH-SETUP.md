# 🔐 SSH Deployment Setup Guide

Complete guide untuk setup SSH deployment ke Hostinger.

## 📋 Prerequisites

- Hostinger account dengan SSH access enabled
- GitHub repository dengan project files
- Basic terminal/command line knowledge

---

## 🏗️ Step 1: Check SSH Access di Hostinger

### 1.1 Login ke Hostinger hPanel
1. Go to [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Login dengan account awak
3. Select domain/website yang nak setup

### 1.2 Check SSH Access
1. Go to **Advanced** → **SSH Access**
2. Check kalau SSH enabled:
   - ✅ **Enabled**: Continue dengan setup
   - ❌ **Disabled**: Contact Hostinger support or upgrade plan

### 1.3 Note SSH Details
Catat maklumat ni:
```
SSH Host: 151.106.117.45
SSH Port: 65002
SSH Username: u359923617
```

---

## 🔑 Step 2: Generate SSH Key Pair

### 2.1 Generate New SSH Key
Buka terminal dan run:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-korban-deploy" -f ~/.ssh/korban_deploy

# Or if ed25519 not supported, use RSA:
ssh-keygen -t rsa -b 4096 -C "github-actions-korban-deploy" -f ~/.ssh/korban_deploy
```

**Enter passphrase**: Leave empty (tekan Enter) untuk automated deployment

### 2.2 Keys Generated
Two files akan created:
- `~/.ssh/korban_deploy` - **Private key** (untuk GitHub)
- `~/.ssh/korban_deploy.pub` - **Public key** (untuk Hostinger)

---

## 🌐 Step 3: Setup Public Key di Hostinger

### 3.1 Copy Public Key Content
```bash
# Mac/Linux
cat ~/.ssh/korban_deploy.pub

# Windows (Command Prompt)
type %USERPROFILE%\.ssh\korban_deploy.pub

# Windows (PowerShell) 
Get-Content ~\.ssh\korban_deploy.pub
```

Copy output yang starts dengan `ssh-ed25519` atau `ssh-rsa`

### 3.2 Add Public Key ke Hostinger
1. **hPanel** → **Advanced** → **SSH Access**
2. Click **"Manage SSH Keys"** atau **"Add New Key"**
3. **Name**: `GitHub Actions Deploy`
4. **Public Key**: Paste content dari step 3.1
5. Click **"Add Key"** atau **"Save"**

### 3.3 Test SSH Connection
```bash
# Test connection (ganti dengan details awak)
ssh -i ~/.ssh/korban_deploy your_username@your_domain.com

# Kalau successful, awak akan masuk ke server
# Type 'exit' untuk keluar
```

---

## 🔒 Step 4: Setup GitHub Secrets

### 4.1 Get Private Key Content
```bash
# Copy ENTIRE private key content including headers
cat ~/.ssh/korban_deploy
```

Copy **EVERYTHING** dari output, including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
[key content]
-----END OPENSSH PRIVATE KEY-----
```

### 4.2 Add Secrets ke GitHub
1. Go to: `https://github.com/mannabo/korban-payment-tracker/settings/secrets/actions`
2. Click **"New repository secret"**
3. Add these secrets satu-persatu:

#### SSH Connection Secrets:
```
Secret Name: HOSTINGER_SSH_HOST
Secret Value: your_domain.com (atau IP address)

Secret Name: HOSTINGER_SSH_USER  
Secret Value: your_ssh_username

Secret Name: HOSTINGER_SSH_KEY
Secret Value: [paste entire private key content]

Secret Name: HOSTINGER_SSH_PORT
Secret Value: 22
```

#### Firebase Configuration Secrets:
```
VITE_FIREBASE_API_KEY = your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN = your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = your_project_id
VITE_FIREBASE_STORAGE_BUCKET = your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
VITE_FIREBASE_APP_ID = your_app_id
VITE_FIREBASE_MEASUREMENT_ID = your_measurement_id (optional)
```

---

## 🚀 Step 5: Test Deployment

### 5.1 Deploy Now!
```bash
# Make small change
echo "SSH deployment test" >> README.md

# Deploy using our script
npm run deploy
```

### 5.2 Watch GitHub Actions
1. Go to: `https://github.com/mannabo/korban-payment-tracker/actions`
2. Watch the **"Deploy to Hostinger via SSH"** workflow
3. Check setiap step untuk troubleshooting

### 5.3 Verify Live Site
Visit: `http://yourdomain.com/korbanperdana`

---

## 🔧 SSH Features Yang Dah Enabled

### ✅ Advanced Features:
- **Automatic Backup**: Creates backup before each deploy
- **Smart Cleanup**: Keeps .htaccess and important files  
- **Deployment Verification**: Checks if deployment successful
- **Old Backup Cleanup**: Keeps only last 5 backups
- **Deployment Info**: Creates info file dengan deploy details
- **Error Handling**: Detailed error messages dan recovery

### 📊 Deployment Process:
1. **SSH Connection Test** - Verify connection
2. **Create Backup** - Backup current version  
3. **Prepare Directory** - Clean old files safely
4. **Upload Files** - Deploy new version via SCP
5. **Verify Deployment** - Check if successful
6. **Cleanup** - Remove old backups

---

## 🚨 Troubleshooting

### SSH Connection Fails
```bash
# Test manually
ssh -vvv -i ~/.ssh/korban_deploy your_username@your_host.com

# Common issues:
# 1. Wrong host/username
# 2. Private key not added to GitHub correctly  
# 3. Public key not authorized on server
# 4. SSH not enabled on hosting plan
```

### Permission Denied
- Check kalau public key betul-betul added ke Hostinger
- Verify private key format (include headers/footers)
- Test SSH connection manually first

### Deployment Path Issues
- Check kalau `/public_html/korbanperdana/` accessible
- Verify username ada permission untuk create directories
- Test dengan manual SSH dan create folder

### GitHub Actions Fails
- Check GitHub Secrets semua complete
- Look for detailed error messages dalam Actions logs
- Verify Firebase config variables betul

---

## 🎉 Success Indicators

Kalau setup successful, awak akan nampak dalam GitHub Actions:
```
✅ SSH Connection successful!
📦 Creating backup...
🧹 Cleaning old files...
📤 Files uploaded successfully
✅ index.html found - deployment successful!
🎉 Deployment completed successfully!
```

**Live site**: `http://yourdomain.com/korbanperdana`

---

## 🔐 Security Best Practices

- ✅ Use dedicated SSH key untuk deployment
- ✅ Never commit private keys to repository
- ✅ Regularly rotate SSH keys (every 6 months)
- ✅ Monitor deployment logs for suspicious activity
- ✅ Keep backup copies of deployment keys securely

**Need help? Check GitHub Actions logs untuk detailed error messages!** 🚀
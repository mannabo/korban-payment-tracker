# 🚀 Auto Deployment Guide - Hostinger

This guide will help you setup automatic deployment from GitHub to your Hostinger hosting.

## 📋 Prerequisites

1. **GitHub Repository** - Your code repository
2. **Hostinger Hosting Account** - With FTP access
3. **Firebase Project** - For backend services

## 🔧 Setup Steps

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and create a new repository
2. Clone this project to the repository:

```bash
# Initialize git (if not already done)
git init

# Add GitHub repository as remote origin
git remote add origin https://github.com/mannabo/korban-payment-tracker.git

# Add all files
git add .

# Commit initial files
git commit -m "Initial commit: Korban Payment Tracker with auto deployment"

# Push to GitHub
git push -u origin main
```

### Step 2: Get Hostinger FTP Details

1. Login to **Hostinger Panel** (hpanel.hostinger.com)
2. Go to **Websites** → Select your domain
3. Go to **Files** → **FTP Accounts**
4. Note down:
   - **FTP Server**: Usually `ftp.yourdomain.com` or IP address
   - **Username**: Your FTP username
   - **Password**: Your FTP password
   - **Directory**: `/public_html/korbanperdana/` for subdomain deployment

### Step 3: Setup GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these secrets:

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

#### Hostinger FTP Secrets:
```
HOSTINGER_FTP_SERVER = ftp.yourdomain.com
HOSTINGER_FTP_USERNAME = your_ftp_username
HOSTINGER_FTP_PASSWORD = your_ftp_password
```

### Alternative: SSH Deployment (Advanced)

If you prefer SSH deployment for better security and control:

#### SSH Secrets (for deploy-ssh.yml workflow):
```
HOSTINGER_SSH_HOST = your_server_ip_or_domain
HOSTINGER_SSH_USER = your_ssh_username  
HOSTINGER_SSH_KEY = your_private_ssh_key
HOSTINGER_SSH_PORT = 22
```

#### To use SSH workflow:
1. Rename `deploy-ssh.yml` to `deploy.yml` 
2. Setup SSH key pair on your Hostinger account
3. Add SSH secrets to GitHub

### Step 4: Test Deployment

1. Make any small change to your code
2. Commit and push to GitHub:

```bash
git add .
git commit -m "Test auto deployment"
git push
```

3. Go to **GitHub** → **Actions** tab to watch the deployment process
4. Check your website to see if changes are live

## 🔄 How It Works

1. **Code Push**: You push code to GitHub main/master branch
2. **GitHub Actions**: Automatically triggered deployment workflow
3. **Build Process**: Installs dependencies and builds the project
4. **Deploy**: Uploads built files to your Hostinger hosting via FTP

## 📁 Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:

1. ✅ Checkout your code
2. ✅ Setup Node.js environment
3. ✅ Install dependencies (`npm ci`)
4. ✅ Run tests (if available)
5. ✅ Build project (`npm run build`)
6. ✅ Upload `dist/` folder to Hostinger via FTP

## 🛠 Troubleshooting

### Build Fails
- Check GitHub Actions logs for errors
- Ensure all environment variables are set correctly
- Verify Firebase configuration is correct

### FTP Upload Fails
- Verify FTP credentials in GitHub Secrets
- Check FTP server address and directory path
- Ensure FTP user has write permissions

### Website Not Loading
- Check if files are in correct directory (`/public_html/`)
- Verify `.htaccess` file for React routing (see below)
- Check browser console for errors

## 🌐 React Router Configuration

Add this `.htaccess` file to your Hostinger `/public_html/korbanperdana/` folder for proper React routing:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QR,L]
```

## 🚨 Security Notes

- ✅ Never commit `.env` files or API keys to GitHub
- ✅ Use GitHub Secrets for sensitive information
- ✅ Regularly update dependencies for security patches
- ✅ Monitor deployment logs for any issues

## 📞 Support

If you encounter issues:

1. Check GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly set
3. Test FTP connection manually if needed
4. Ensure Hostinger hosting supports static file hosting

---

## 🎉 Once Setup Complete

Every time you push code to GitHub:
- ⚡ Automatic build and deployment
- 🔄 Zero downtime updates
- 📊 Deployment history tracking
- 🔒 Secure credential management

Your development workflow becomes:
```
Code → Git Push → Auto Deploy → Live Website ✨
```

## Next Steps After Deployment

1. Setup custom domain (if needed)
2. Configure SSL certificate
3. Setup monitoring and analytics
4. Consider CDN for better performance
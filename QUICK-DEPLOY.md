# ⚡ 1-Click Deploy Guide

Selepas siap develop 1 feature, guna salah satu method ni untuk **instant deploy**:

## 🚀 Method 1: Windows Script
```cmd
# Double-click atau run dalam CMD
deploy.bat
```

## 🐧 Method 2: Linux/Mac Script  
```bash
# Terminal
./deploy.sh
```

## 📦 Method 3: NPM Commands
```bash
# Smart deploy dengan options
npm run deploy

# Quick deploy dengan default message
npm run deploy:quick

# Deploy ke staging
npm run deploy:staging
```

## 🎯 Method 4: Manual Git (Classic)
```bash
git add .
git commit -m "🚀 Feature complete"
git push origin main
```

---

## ⚙️ What Happens Automatically:

1. **Script detects changes** ✅
2. **Asks for commit message** 📝  
3. **Commits & pushes to GitHub** 🌐
4. **GitHub Actions triggered** ⚡
5. **Auto build & deploy to Hostinger** 🚀
6. **Live website updated** 🎉

**Time: ~2-3 minutes dari push sampai live!**

---

## 🎛️ Smart Deploy Features:

### **deploy.js** (Most Powerful):
- 📊 **3 deploy types**: Production, Staging, Quick
- 🎨 **Colored output** with status updates  
- 🌐 **Auto browser opening** untuk GitHub Actions
- ❌ **Error detection** dengan helpful messages
- ⏰ **Timestamp commit messages**

### **Deploy Targets**:
- `main` branch → **Production** (yourdomain.com)
- `staging` branch → **Staging** (yourdomain.com/staging)

---

## 🚨 Before First Deploy:

Ensure GitHub Secrets are setup:
- ✅ Firebase config variables
- ✅ Hostinger SSH credentials (Host, User, Key, Port)
- ✅ SSH keys configured on Hostinger
- ✅ GitHub Actions enabled

**Setup Guide**: See `SSH-SETUP.md` for detailed instructions
**Check Secrets**: https://github.com/mannabo/korban-payment-tracker/settings/secrets/actions

---

## 🎉 Usage Examples:

```bash
# After completing Receipt Management responsive feature:
npm run deploy
> "🔧 Enhanced receipt management mobile responsive"

# Quick bug fix:
npm run deploy:quick
> Commits with timestamp automatically

# Test on staging first:  
npm run deploy:staging
> Deploys to staging environment
```

**Your new workflow: Code → `npm run deploy` → Live! 🚀**
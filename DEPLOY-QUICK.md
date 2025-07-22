# ⚡ Quick Deploy Reference

**Bila awak off terminal dan nak deploy balik, ikut commands ni:**

## 🚀 Standard Deploy Process

```bash
# 1. Navigate ke project
cd /home/mannabo/projects/korban-payment-tracker

# 2. Check status
git status

# 3. Add changes
git add .

# 4. Commit dengan message
git commit -m "🚀 Your changes description"

# 5. Push untuk deploy
git push origin master
```

## ⚡ Super Quick One-Liner

```bash
cd /home/mannabo/projects/korban-payment-tracker && git add . && git commit -m "🚀 Quick update - $(date)" && git push origin master
```

## 🔧 Useful Commands

### Check if you're in right directory
```bash
pwd
ls -la
```

### Build and test locally
```bash
npm run build
npm run lint
```

### Check recent commits
```bash
git log --oneline -5
```

### Check deployment status
```bash
echo "Check: https://github.com/mannabo/korban-payment-tracker/actions"
```

## 📝 Common Commit Messages

```bash
# Features
git commit -m "🚀 Add new payment feature"
git commit -m "✨ Enhance user interface"

# Fixes  
git commit -m "🔧 Fix PDF upload issue"
git commit -m "🐛 Fix payment calculation bug"

# Updates
git commit -m "🎨 Improve responsive design"
git commit -m "📄 Update documentation"
git commit -m "🔒 Update security settings"
```

## 🌐 Live Site

**Production:** https://korbanperdana.jpkkhangtuah.com

**Deployment time:** 2-3 minutes selepas push

## 🚨 Emergency Commands

### If something goes wrong
```bash
# Check what happened
git log --oneline -3

# Undo last commit (keep changes)
git reset HEAD~1

# Force push (USE CAREFULLY!)
git push origin master --force
```

### If deployment fails
```bash
# Check GitHub Actions
echo "https://github.com/mannabo/korban-payment-tracker/actions"

# Manual trigger deployment
git commit --allow-empty -m "🔧 Trigger deployment" && git push origin master
```

## 📂 Project Structure Quick Reference

```
korban-payment-tracker/
├── src/
│   ├── components/     # UI components
│   ├── pages/         # Main pages
│   ├── utils/         # Helper functions
│   └── types/         # TypeScript types
├── .github/workflows/ # Deployment config
├── storage.rules      # Firebase storage rules  
├── firestore.rules    # Database rules
└── CLAUDE.md          # Full project docs
```

## 🎯 Quick Troubleshooting

**Problem:** `permission denied`
**Solution:** Check if you're in project directory

**Problem:** `nothing to commit`
**Solution:** Make sure files are changed/saved

**Problem:** `merge conflict`
**Solution:** `git pull origin master` then resolve conflicts

---

**💡 Tip:** Bookmark this file! Just type `cat DEPLOY-QUICK.md` to see commands.

**🤖 Generated with [Claude Code](https://claude.ai/code)**
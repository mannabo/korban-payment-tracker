#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "========================================"
echo "   🚀 KORBAN TRACKER - AUTO DEPLOY"
echo "========================================"
echo -e "${NC}"

# Check if we have uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ No changes detected. Nothing to deploy.${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Changes detected! Preparing deployment...${NC}"
echo

# Get commit message from user
echo -n "💬 Enter commit message (or press Enter for default): "
read commit_message

if [ -z "$commit_message" ]; then
    commit_message="🚀 Auto deploy - $(date)"
fi

echo
echo -e "${BLUE}🔄 Starting deployment process...${NC}"
echo

# Add all changes
echo -e "${YELLOW}➕ Adding all files...${NC}"
if ! git add .; then
    echo -e "${RED}❌ Failed to add files${NC}"
    exit 1
fi

# Commit changes
echo -e "${YELLOW}📦 Committing changes...${NC}"
if ! git commit -m "$commit_message"; then
    echo -e "${RED}❌ Failed to commit changes${NC}"
    exit 1
fi

# Push to GitHub
echo -e "${YELLOW}🌐 Pushing to GitHub...${NC}"
if ! git push origin main; then
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    exit 1
fi

echo
echo -e "${GREEN}✅ SUCCESS! Deployment initiated${NC}"
echo
echo -e "${PURPLE}🔗 Check progress at: https://github.com/mannabo/korban-payment-tracker/actions${NC}"
echo -e "${CYAN}🌐 Live site will update automatically via GitHub Actions${NC}"
echo
echo -e "${YELLOW}⏳ Deployment typically takes 2-3 minutes...${NC}"
echo

# Option to open GitHub Actions (on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -n "🔍 Open GitHub Actions in browser? (y/n): "
    read -r open_actions
    if [[ $open_actions == [Yy]* ]]; then
        open https://github.com/mannabo/korban-payment-tracker/actions
    fi
fi

echo
echo -e "${GREEN}🎉 Deploy script completed!${NC}"
echo -e "${CYAN}Your changes are being deployed automatically.${NC}"
echo
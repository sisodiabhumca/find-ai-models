# 🔧 Troubleshooting Guide

## GitHub Actions Issues

### Problem: "The process '/usr/bin/git' failed with exit code 128"

**Cause**: Authentication issues when trying to commit and push changes from GitHub Actions.

**Solution**: 
1. ✅ **Fixed**: Added proper permissions to workflows
2. ✅ **Fixed**: Added GITHUB_TOKEN environment variable
3. ✅ **Fixed**: Created simpler workflows that don't require git commits

### Problem: GitHub Pages 404 Error

**Cause**: Deployment workflow issues or incorrect configuration.

**Solution**:
1. ✅ **Fixed**: Created simpler deployment workflow
2. ✅ **Fixed**: Added proper GitHub Pages permissions
3. ✅ **Fixed**: Created root index.html file

## 🔄 Current Workflow Status

### Working Workflows
- ✅ **Simple Discovery**: Runs discovery without committing changes
- ✅ **Simple Deploy**: Deploys to GitHub Pages using modern actions
- ✅ **Root Landing Page**: index.html in repository root

### Disabled Workflows (Temporarily)
- ⚠️ **Original Discovery**: Has authentication issues
- ⚠️ **Original Deploy**: Uses deprecated actions

## 🚀 Quick Fix Steps

### 1. Enable GitHub Pages
1. Go to repository **Settings** → **Pages**
2. **Source**: Deploy from branch
3. **Branch**: `main`
4. **Folder**: `/ (root)`
5. **Save**

### 2. Test the Live Demo
- **URL**: https://sisodiabhumca.github.io/find-ai-models
- **Alternative**: https://sisodiabhumca.github.io/find-ai-models/public/static.html

### 3. Monitor GitHub Actions
- Go to **Actions** tab
- Check **Simple Discovery** workflow
- Check **Simple Deploy** workflow

## 📋 Manual Setup Instructions

### If GitHub Pages Still Doesn't Work

1. **Clone the repository locally**:
   ```bash
   git clone https://github.com/sisodiabhumca/find-ai-models.git
   cd find-ai-models
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm run dev
   ```

4. **Access locally**: http://localhost:3000

### Alternative: Use Static Version

1. **Open the static file directly**:
   - Navigate to `public/static.html` in the repository
   - Click "Raw" to view the file
   - Copy the URL and use it directly

## 🔧 Advanced Troubleshooting

### GitHub Actions Authentication

If you want to enable the original discovery workflow with commits:

1. **Create Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` permissions
   - Copy the token

2. **Add Repository Secret**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add new secret: `PAT_TOKEN` with your personal access token

3. **Update Workflow**:
   ```yaml
   env:
     GITHUB_TOKEN: ${{ secrets.PAT_TOKEN }}
   ```

### GitHub Pages Configuration

If pages still don't work:

1. **Check branch protection**:
   - Go to Settings → Branches
   - Ensure main branch allows pushes

2. **Check Actions permissions**:
   - Go to Settings → Actions → General
   - Ensure "Allow GitHub Actions to create and approve pull requests" is enabled

3. **Manual deployment**:
   - Create `gh-pages` branch manually
   - Copy static files to that branch
   - Set Pages source to `gh-pages` branch

## 📊 Current Status

### ✅ Working
- Repository is live on GitHub
- Source code is complete and functional
- Local development works perfectly
- Static demo is available

### ⚠️ Needs Attention
- GitHub Pages deployment (being fixed)
- Automated discovery commits (simplified version working)

### 🔄 In Progress
- Simplified workflows are being tested
- GitHub Pages configuration is being updated

## 🎯 Next Steps

1. **Wait for GitHub Actions to complete** (should be working now)
2. **Check GitHub Pages** (should be live in a few minutes)
3. **Test the live demo** at the GitHub Pages URL
4. **Monitor discovery workflow** (runs daily at 5 PM PST)

## 📞 Support

If issues persist:

1. **Check GitHub Actions logs** for specific error messages
2. **Review this troubleshooting guide**
3. **Try the local setup** as a workaround
4. **Check repository issues** for similar problems

---

**Repository**: https://github.com/sisodiabhumca/find-ai-models  
**Local Setup**: Clone and run `npm run dev`  
**Static Demo**: Available in `public/static.html`

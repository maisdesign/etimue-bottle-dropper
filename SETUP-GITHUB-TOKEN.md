# 🔑 GitHub Token Setup for Automated Deployment

## Step-by-Step Guide

### 1. Create Personal Access Token

1. **Go to GitHub Settings**
   - Click your profile picture → Settings
   - Or visit: https://github.com/settings/tokens

2. **Navigate to Developer Settings**
   - Left sidebar → Developer settings
   - Click "Personal access tokens" → "Tokens (classic)"

3. **Generate New Token**
   - Click "Generate new token" → "Generate new token (classic)"
   - Note: Give it a descriptive name like "Etimuè Deployment"

4. **Configure Token Permissions**
   Select these scopes:
   - ✅ **repo** (Full control of private repositories)
     - repo:status
     - repo_deployment
     - public_repo
     - repo:invite
     - security_events
   - ✅ **workflow** (Update GitHub Action workflows)

5. **Generate and Copy Token**
   - Click "Generate token"
   - **⚠️ IMPORTANT**: Copy the token immediately - you won't see it again!

### 2. Add Token to Repository Secrets

1. **Go to Main Repository**
   - Visit: https://github.com/maisdesign/etimue-bottle-dropper

2. **Open Repository Settings**
   - Click "Settings" tab (you need admin access)

3. **Navigate to Secrets**
   - Left sidebar → "Secrets and variables" → "Actions"

4. **Add Repository Secret**
   - Click "New repository secret"
   - **Name**: `DEPLOY_TOKEN`
   - **Secret**: Paste the token from step 1
   - Click "Add secret"

### 3. Verify Token Works

After adding the token, the next push to `main` branch should trigger deployment:

```bash
# Test with a small change
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: trigger deployment"
git push origin main
```

### 4. Monitor Deployment

1. **Check GitHub Actions**
   - Go to repository → "Actions" tab
   - Look for "Deploy to Netlify Repository" workflow

2. **Check Target Repository**
   - Visit: https://github.com/maisdesign/bottledropper
   - Should see fresh commit with built files

3. **Check Netlify**
   - If connected, should auto-deploy from bottledropper repo

## 🐛 Troubleshooting

### Token Issues
- **"Bad credentials"**: Token may be expired or incorrect
- **"Permission denied"**: Token needs `repo` scope
- **"Resource not accessible"**: Check repository name spelling

### Workflow Issues
- **Workflow doesn't run**: Check if workflow file is in `.github/workflows/`
- **Build fails**: Check if `npm run build` works locally
- **Deploy fails**: Verify token has write access to target repo

### Manual Deployment
If automated deployment fails, use manual deployment:

```bash
npm run deploy:build
```

## 🔒 Security Best Practices

- ✅ Use fine-grained tokens when possible
- ✅ Set token expiration (recommended: 90 days)
- ✅ Store tokens only in GitHub Secrets (never in code)
- ✅ Use minimal required permissions
- ❌ Never commit tokens to repository
- ❌ Don't share tokens in chat or email

## 📞 Support

If deployment still fails after following this guide:

1. Check GitHub Actions logs for specific error messages
2. Verify all file paths and repository names are correct
3. Test manual deployment with `npm run deploy:build`
4. Ensure you have admin access to both repositories
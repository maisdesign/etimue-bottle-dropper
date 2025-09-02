# Deployment Configuration

This document explains how to set up automated deployment from the main repository to a separate deployment repository for Netlify.

## 🏗️ Architecture

- **Main Repository**: `maisdesign/etimue-bottle-dropper` - Contains all source code
- **Deployment Repository**: `maisdesign/bottledropper` - Contains only built files from `dist/`
- **Netlify**: Connected to deployment repository for automatic publishing

## ⚙️ Setup Instructions

### 1. Create Deployment Repository

The deployment repository already exists:
```bash
# Repository: https://github.com/maisdesign/bottledropper
# This will receive the built files from dist/
```

### 2. Generate GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Actions workflows)
3. Copy the token - you'll need it in step 3

### 3. Configure Repository Secrets

In your main repository (`etimue-bottle-dropper`):

1. Go to Settings → Secrets and variables → Actions
2. Add new repository secret:
   - **Name**: `DEPLOY_TOKEN`
   - **Value**: The token from step 2

### 4. Workflow Configuration

The workflow is already configured to deploy to:
```yaml
external_repository: maisdesign/bottledropper
```

### 5. Connect Netlify to Deployment Repository

1. In Netlify dashboard, create new site from Git
2. Connect to your deployment repository (`maisdesign/bottledropper`)
3. Configure build settings:
   - **Build command**: (leave empty - files are pre-built)
   - **Publish directory**: `/` (root of repository)
   - **Branch**: `main`

### 6. Configure Netlify Environment Variables

Add these environment variables in Netlify:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_ADMIN_UUIDS`: Comma-separated admin user IDs

## 🔄 Workflow Process

1. **Developer pushes** to main repository
2. **GitHub Actions triggers**:
   - Installs dependencies
   - Builds project (`npm run build`)
   - Pushes `dist/` contents to deployment repository
3. **Netlify detects** changes in deployment repository
4. **Netlify deploys** automatically (no build needed - files are pre-built)

## 📁 File Distribution

### Main Repository Contains:
- Source code (`src/`)
- Configuration files (`package.json`, `vite.config.ts`, etc.)
- Development tools and dependencies
- Documentation
- GitHub Actions workflows

### Deployment Repository Contains:
- Built files (`index.html`, `assets/`, etc.)
- Static assets (`favicon.ico`, `manifest.webmanifest`)
- Netlify configuration (`_redirects`)
- Service Worker files (`sw.js`, `workbox-*.js`)

## 🐛 Troubleshooting

### Build Fails
- Check GitHub Actions logs in main repository
- Verify all dependencies are listed in `package.json`
- Ensure build command works locally: `npm run build`

### Deployment Fails
- Verify `DEPLOY_TOKEN` has correct permissions
- Check deployment repository exists and is accessible
- Review GitHub Actions logs for authentication errors

### Netlify Deployment Issues
- Verify environment variables are set in Netlify
- Check Netlify build logs (should be minimal since files are pre-built)
- Ensure `_redirects` file is present for SPA routing

### Missing Files
- Check if files are being excluded by `.gitignore`
- Verify `dist/` directory contains all necessary files after build
- Check GitHub Actions artifact uploads for debugging

## 🔧 Advanced Configuration

### Multiple Environments
To set up staging/production environments:

1. Create multiple deployment repositories:
   - `etimue-bottle-dropper-staging`
   - `etimue-bottle-dropper-production`

2. Use the advanced workflow (`.github/workflows/deploy-advanced.yml.example`)

3. Configure branch protection rules for controlled deployments

### Conditional Deployment
The advanced workflow includes smart deployment that only triggers when:
- Files in `src/` or config files change
- Builds complete successfully
- Specific branches are updated

## 🚀 Benefits of This Setup

- **Separation of Concerns**: Source code and deployment artifacts are separate
- **Fast Deployments**: Netlify only handles static file serving, no build process
- **Version Control**: Both source and built files are tracked
- **Rollback Capability**: Easy to revert to previous deployment
- **Security**: Source code can remain private while deployment repo can be public
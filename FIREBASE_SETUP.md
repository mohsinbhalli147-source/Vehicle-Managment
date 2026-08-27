# Firebase Hosting Setup Guide for Sardar Autos

This guide explains how to deploy the Vehicle Management System to Firebase Hosting while keeping Supabase as the backend.

## Architecture

```
Firebase Hosting (Frontend) → Domain & CDN
    ↓
Next.js Static Export (Client-side App)
    ↓
Supabase (Backend)
    ├── Database (PostgreSQL)
    ├── Authentication
    └── Real-time APIs
```

## Prerequisites

- Firebase account with project "Sardar Autos"
- Firebase account: mohsinbhalli147@gmail.com
- Node.js and npm installed
- Firebase CLI installed

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication with mohsinbhalli147@gmail.com

## Step 3: Initialize Firebase for Your Project

```bash
firebase init
```

Select the following options:
- **Hosting**: Configure for Firebase Hosting
- **Use an existing project**: Select "Sardar Autos"
- **Public directory**: `out` (already configured)
- **Configure as single-page app**: Yes (for Next.js routing)
- **Set up automatic builds**: No (optional for later)

## Step 4: Build the Application

```bash
npm run build
```

This will create an optimized static build in the `out` directory.

## Step 5: Deploy to Firebase

```bash
firebase deploy
```

This will deploy your application to Firebase Hosting with domain support.

## Step 6: Configure Custom Domain

After deployment:

1. Go to Firebase Console → Hosting
2. Your app will be available at: `https://sardar-autos.web.app` (or similar)
3. Add custom domain in Firebase Console → Hosting → Custom Domains
4. Configure DNS settings for your custom domain

## Environment Variables Setup

Create `.env.production` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lajcyndbhtawcbghqxct.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7VnpI7wkElTzRzol4pCwpQ_918Gwdnf
```

**Important**: The build process will include these environment variables in the static build.

## Continuous Deployment (Optional)

For automatic deployment on push to GitHub:

1. Go to Firebase Console → Build Settings
2. Connect to your GitHub repository: `mohsinbhalli147-source/Vehicle-Managment`
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `out`
   - Node.js version: 18

## Domain Setup for Sardar Autos

You can set up a custom domain like:
- `sardarautos.com`
- `sardar-autos.com`
- Or any domain you own

Steps:
1. Purchase domain from any registrar
2. Go to Firebase Console → Hosting → Custom Domains
3. Add your domain
4. Update DNS records as instructed by Firebase

## Benefits of This Setup

- ✅ **Firebase Hosting**: Fast global CDN, free SSL, custom domains
- ✅ **Supabase Backend**: Database, Auth, RLS - unchanged
- ✅ **Performance**: Static export for faster loading
- ✅ **Cost**: Free hosting on Firebase
- ✅ **Professional**: Custom domain for Sardar Autos
- ✅ **Scalability**: Auto-scaling infrastructure

## Troubleshooting

**Build fails:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Deployment fails:**
```bash
# Check Firebase login
firebase login --list
# Re-login if needed
firebase login
```

**Routing issues:**
- Next.js static export handles client-side routing
- Firebase configured for SPA support
- All routes work as expected

**Supabase connection:**
- Verify environment variables in `.env.production`
- Check Supabase project is active
- Ensure RLS policies are configured correctly

## Quick Deploy Command

After initial setup, just run:

```bash
npm run build && firebase deploy
```

## Summary

Your "Sardar Autos" project will be:
- **Hosted on Firebase** with custom domain
- **Backend on Supabase** (unchanged)
- **Professional branding** with Sardar Autos domain
- **Fast and scalable** with global CDN
- **Free to host** on Firebase

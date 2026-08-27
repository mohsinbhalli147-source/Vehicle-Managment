# Firebase Hosting Setup for Sardar Autos

## Firebase Functions + Hosting (Working Solution)

Tumhara app Firebase Hosting + Functions se deploy ho sakta hai!

## Prerequisites

1. **Firebase CLI Install:**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase:**
```bash
firebase login
```

## Step 1: Build the App

```bash
npm run build
```

This creates the production build in `.next` directory.

## Step 2: Copy Build to Functions

```bash
node copy-build.js
```

This copies build files to the `functions` directory.

## Step 3: Deploy to Firebase

```bash
firebase deploy
```

Or use the combined command:
```bash
npm run deploy
```

## Step 4: Access Your App

After deployment:
- Firebase Hosting URL: `https://sardar-autos.web.app`
- Firebase Console → Hosting → Custom Domains

## Custom Domain Setup

1. Firebase Console → Hosting → Custom Domains
2. Add your domain (e.g., sardarautos.com)
3. Configure DNS settings
4. SSL certificate auto-generated

## Environment Variables

Environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://lajcyndbhtawcbghqxct.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7VnpI7wkElTzRzol4pCwpQ_918Gwdnf
```

Note: For Firebase Functions, you may need to set these in Firebase Console → Functions → Environment Variables.

## Architecture

- **Firebase Hosting:** Serves static assets
- **Firebase Functions:** Runs Next.js server
- **Supabase:** Backend database & auth
- **Node.js 20:** Runtime environment

## Benefits

- ✅ Free Firebase Hosting
- ✅ Free Firebase Functions (with limits)
- ✅ Global CDN
- ✅ Free SSL certificates
- ✅ Custom domain support
- ✅ Supabase backend unchanged
- ✅ Professional Sardar Autos branding

## Troubleshooting

**Build fails:**
```bash
rm -rf node_modules .next
npm install
npm run build
```

**Deployment fails:**
```bash
firebase login
firebase deploy
```

**Functions timeout:**
- Firebase Console → Functions → nextjsServer
- Increase timeout (up to 9 minutes)
- Increase memory allocation

## Quick Deploy Commands

```bash
# Full deployment
npm run deploy

# Or step by step
npm run build
node copy-build.js
firebase deploy
```

## Cost Estimate

- **Firebase Hosting:** Free (10GB/month)
- **Firebase Functions:** Free tier includes:
  - 125,000 invocations/month
  - 40,000 GB-seconds/month
  - 10 GB network egress/month
- **Supabase:** Free tier (500MB database)

## Summary

Your "Sardar Autos" app will be:
- ✅ Hosted on Firebase Hosting
- ✅ Powered by Firebase Functions
- ✅ Connected to Supabase backend
- ✅ Professional domain support
- ✅ Fast global CDN
- ✅ Free to host (within limits)

## Next Steps

1. Run `npm run deploy`
2. Test at `https://sardar-autos.web.app`
3. Add custom domain in Firebase Console
4. Enjoy your professional vehicle management system!
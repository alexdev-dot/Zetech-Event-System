# Vercel + Railway Deployment Guide

This guide provides step-by-step instructions for deploying the Zetech Event System with:
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Supabase

## Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Vercel    │────────▶│  Railway    │────────▶│  Supabase   │
│  (Frontend) │  HTTPS  │  (Backend)  │  HTTPS  │  (Database) │
└─────────────┘         └─────────────┘         └─────────────┘
```

## Prerequisites

- Vercel account (free tier available)
- Railway account (free tier available)
- Supabase account with project configured
- GitHub repository with your code
- Domain name (optional, but recommended for production)

## Step 1: Prepare Your Repository

### 1.1 Create Separate Backend Directory Structure

Ensure your repository has this structure:
```
zetech-event-system/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── ... (other backend files)
├── src/ (frontend source)
├── package.json (frontend)
├── vite.config.ts
├── .env.example
└── ... (other frontend files)
```

### 1.2 Create Railway-Specific Configuration

Create `backend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.3 Create Vercel-Specific Configuration

Create `vercel.json` in the root:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-railway-backend-url.railway.app/api/:path*"
    },
    {
      "source": "/uploads/:path*",
      "destination": "https://your-railway-backend-url.railway.app/uploads/:path*"
    },
    {
      "source": "/socket.io/:path*",
      "destination": "https://your-railway-backend-url.railway.app/socket.io/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 1.4 Update Frontend Environment Configuration

Update your frontend code to use the Railway backend URL in production. Modify `src/config/api.ts` or create it:

```typescript
// src/config/api.ts
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://your-railway-backend-url.railway.app' 
    : 'http://localhost:3001');

export const API_BASE_URL = API_URL;
```

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will detect it as a Node.js project

### 2.2 Configure Backend Service

1. Click on your backend service
2. Go to "Settings" tab
3. Set the root directory to `backend`
4. Set the start command to `node server.js`

### 2.3 Add Environment Variables in Railway

Go to the "Variables" tab in Railway and add these variables:

```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-vercel-frontend-url.vercel.app

# JWT Secret (generate a secure one)
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Africa's Talking SMS (Optional)
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=sandbox
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.4 Deploy Backend

1. Click "Deploy" in Railway
2. Wait for the deployment to complete
3. Railway will provide a URL like: `https://your-backend-name.up.railway.app`
4. Copy this URL - you'll need it for Vercel configuration

### 2.5 Verify Backend Deployment

Test your backend:
```bash
curl https://your-backend-name.up.railway.app/api/health
```

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will detect it as a Vite project

### 3.2 Configure Build Settings

Vercel should auto-detect these settings. Verify:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 Add Environment Variables in Vercel

Go to "Settings" > "Environment Variables" and add:

```env
VITE_API_URL=https://your-backend-name.up.railway.app
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3.4 Update Vercel Configuration

After deploying the backend and getting its URL, update `vercel.json`:

Replace `your-railway-backend-url.railway.app` with your actual Railway backend URL.

### 3.5 Deploy Frontend

1. Click "Deploy"
2. Wait for deployment to complete
3. Vercel will provide a URL like: `https://your-project-name.vercel.app`

## Step 4: Update Railway Backend CORS

After deploying the frontend, update the `CLIENT_URL` in Railway:

1. Go to Railway backend service
2. Go to "Variables" tab
3. Update `CLIENT_URL` to your Vercel URL:
   ```env
   CLIENT_URL=https://your-project-name.vercel.app
   ```
4. Redeploy the backend

## Step 5: Configure Supabase

### 5.1 Update Supabase CORS Settings

1. Go to Supabase Dashboard
2. Navigate to "Authentication" > "URL Configuration"
3. Add your Vercel URL to "Site URL"
4. Add your Vercel URL to "Redirect URLs"

### 5.2 Enable Row Level Security (RLS)

Ensure RLS policies are set up in Supabase. Run this in Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_poll_votes ENABLE ROW LEVEL SECURITY;
```

### 5.3 Create RLS Policies

Add appropriate policies for your tables. Example for student_registrations:

```sql
-- Allow public read access
CREATE POLICY "Public read access" ON student_registrations
  FOR SELECT USING (true);

-- Allow authenticated insert
CREATE POLICY "Authenticated insert" ON student_registrations
  FOR INSERT WITH CHECK (true);
```

## Step 6: Update Frontend API Configuration

Update your frontend to use the production backend URL:

```typescript
// src/config/api.ts
const API_URL = import.meta.env.VITE_API_URL;

export const API_BASE_URL = API_URL;
```

Update all API calls to use this base URL:

```typescript
import { API_BASE_URL } from '@/config/api';

// Example API call
fetch(`${API_BASE_URL}/api/health`)
  .then(res => res.json())
  .then(data => console.log(data));
```

## Step 7: Test the Deployment

### 7.1 Test Backend Health

```bash
curl https://your-backend-name.up.railway.app/api/health
```

### 7.2 Test Frontend

1. Open your Vercel URL in a browser
2. Test authentication flow
3. Test event creation and registration
4. Test file uploads
5. Test real-time features (WebSocket)

### 7.3 Check Browser Console

Open browser DevTools and check for:
- CORS errors
- Network request failures
- WebSocket connection issues

## Step 8: Configure Custom Domain (Optional)

### 8.1 Vercel Custom Domain

1. Go to Vercel project "Settings" > "Domains"
2. Add your custom domain
3. Configure DNS records as instructed by Vercel

### 8.2 Railway Custom Domain (Optional)

1. Go to Railway backend service "Settings" > "Networking"
2. Add your custom domain
3. Configure DNS records

### 8.3 Update Environment Variables

After setting custom domains, update:
- `CLIENT_URL` in Railway to your custom frontend domain
- `VITE_API_URL` in Vercel to your custom backend domain (if using custom backend domain)

## Step 9: Monitor and Maintain

### 9.1 Railway Monitoring

- Check Railway dashboard for backend health
- Monitor logs in Railway console
- Set up alerts for deployment failures

### 9.2 Vercel Monitoring

- Check Vercel dashboard for frontend health
- Monitor build logs
- Set up analytics

### 9.3 Supabase Monitoring

- Monitor database performance in Supabase dashboard
- Check query performance
- Monitor storage usage

## Troubleshooting

### CORS Errors

**Problem**: Frontend can't connect to backend due to CORS

**Solution**:
1. Verify `CLIENT_URL` in Railway matches your Vercel URL exactly
2. Check backend CORS configuration in `server.js`
3. Ensure Railway backend is deployed and accessible

### Environment Variables Not Loading

**Problem**: Application fails to start or missing config

**Solution**:
1. Verify all required environment variables are set in both platforms
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding environment variables
4. Check Railway and Vercel logs for specific errors

### WebSocket Connection Issues

**Problem**: Real-time features not working

**Solution**:
1. Verify Railway backend allows WebSocket connections
2. Check if your Railway plan supports WebSockets
3. Update Vercel rewrites to handle WebSocket traffic
4. Test WebSocket connection directly to Railway URL

### Build Failures

**Problem**: Vercel or Railway build fails

**Solution**:
1. Check build logs for specific errors
2. Ensure all dependencies are in package.json
3. Verify Node.js version compatibility
4. Test build locally: `npm run build`

### Database Connection Issues

**Problem**: Backend can't connect to Supabase

**Solution**:
1. Verify Supabase URL and keys are correct
2. Check Supabase project is not paused
3. Ensure `exec_sql` function exists in Supabase
4. Test connection from Railway console

## Cost Optimization

### Vercel (Free Tier)
- 100GB bandwidth per month
- Unlimited deployments
- SSL certificates included
- Automatic HTTPS

### Railway (Free Tier)
- $5 free credit per month
- 512MB RAM
- Shared CPU
- 1GB storage

### Supabase (Free Tier)
- 500MB database
- 1GB storage
- 2GB bandwidth
- 50,000 monthly active users

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Enable HTTPS** on both platforms (automatic on Vercel/Railway)
4. **Rotate secrets regularly**
5. **Monitor logs** for suspicious activity
6. **Keep dependencies updated**
7. **Use Supabase RLS** for database security
8. **Enable rate limiting** (already configured in backend)

## Update and Deployment Workflow

### Making Updates

1. **Push changes to GitHub**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Railway will auto-deploy backend**
   - Monitor deployment in Railway dashboard
   - Check logs for errors

3. **Vercel will auto-deploy frontend**
   - Monitor deployment in Vercel dashboard
   - Check build logs for errors

### Database Migrations

For database changes:
1. Run migration scripts in Supabase SQL Editor
2. Test in development first
3. Apply to production during low-traffic periods

## Support and Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Supabase Docs**: https://supabase.com/docs
- **Project README**: See main README.md for application details
- **API Documentation**: See backend/API.md

## Quick Reference

### Railway Backend URL Format
```
https://your-project-name.up.railway.app
```

### Vercel Frontend URL Format
```
https://your-project-name.vercel.app
```

### Environment Variable Summary

**Railway (Backend)**:
- `NODE_ENV=production`
- `PORT=3001`
- `CLIENT_URL=https://your-vercel-app.vercel.app`
- `JWT_SECRET=your_secure_secret`
- `SUPABASE_URL=your_supabase_url`
- `SUPABASE_SERVICE_ROLE_KEY=your_service_key`
- `SUPABASE_ANON_KEY=your_anon_key`

**Vercel (Frontend)**:
- `VITE_API_URL=https://your-railway-app.up.railway.app`
- `VITE_SUPABASE_URL=your_supabase_url`
- `VITE_SUPABASE_ANON_KEY=your_anon_key`

## Success Checklist

Before considering deployment complete:

- [ ] Backend deployed successfully on Railway
- [ ] Frontend deployed successfully on Vercel
- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] Authentication flow works
- [ ] API calls succeed from frontend
- [ ] File uploads work correctly
- [ ] WebSocket connections established
- [ ] CORS properly configured
- [ ] Environment variables set correctly
- [ ] Supabase database accessible
- [ ] Custom domain configured (if applicable)
- [ ] SSL/HTTPS enabled
- [ ] Monitoring and logging set up

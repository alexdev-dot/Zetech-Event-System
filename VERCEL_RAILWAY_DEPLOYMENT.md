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

## Important Notes for University/Enterprise Deployment

**Before deploying in university systems:**
- Ensure outbound HTTPS traffic is allowed to `*.vercel.app`, `*.railway.app`, and `*.supabase.co`
- Verify firewall rules allow WebSocket connections (ports 443/80)
- Check if proxy servers require special configuration
- Confirm that GitHub integration is accessible from your network
- Test deployment in a staging environment first if possible

## Prerequisites

- Vercel account (free tier available)
- Railway account (free tier available)
- Supabase account with project configured
- GitHub repository with your code
- Domain name (optional, but recommended for production)
- Node.js 18+ installed locally for testing
- Git installed and configured

## Step 0: Pre-Deployment Checklist (CRITICAL)

**Complete these checks BEFORE starting deployment:**

### 0.1 Verify Local Setup
```bash
# Check Node.js version (must be 18+)
node --version

# Check Git version
git --version

# Test frontend build locally
cd /path/to/zetech-event-system
npm install
npm run build

# Test backend locally
cd backend
npm install
npm start
```

### 0.2 Verify Repository Structure
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
├── .gitignore (must include .env files)
└── ... (other frontend files)
```

### 0.3 Verify .gitignore
Ensure `.gitignore` includes:
```
.env
.env.local
.env.*.local
node_modules/
dist/
uploads/
*.log
.DS_Store
```

### 0.4 Commit All Changes
```bash
git add .
git commit -m "Pre-deployment: Ready for Vercel/Railway deployment"
git push origin main
```

## Step 1: Prepare Your Repository

### 1.1 Create Railway-Specific Configuration

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
    "restartPolicyMaxRetries": 10,
    "numReplicas": 1
  }
}
```

**IMPORTANT**: Commit this file to your repository before deploying.

### 1.2 Create Vercel-Specific Configuration

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

### 1.3 Create Frontend API Configuration

Create or update `src/config/api.ts`:
```typescript
// src/config/api.ts
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://your-railway-backend-url.railway.app' 
    : 'http://localhost:3001');

export const API_BASE_URL = API_URL;
```

**IMPORTANT**: This configuration ensures the frontend dynamically uses the backend URL from environment variables, making deployment flexible and environment-independent.

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

Go to the "Variables" tab in Railway and add these variables **EXACTLY** as shown:

```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-vercel-frontend-url.vercel.app

# JWT Secret (generate a secure one - MUST be at least 32 characters)
JWT_SECRET=your_secure_jwt_secret_minimum_32_characters

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Africa's Talking SMS (Optional - can be added later)
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=sandbox
```

**CRITICAL - Generate JWT Secret:**
```bash
# Run this locally to generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and use it as JWT_SECRET
```

**IMPORTANT NOTES:**
- Set `CLIENT_URL` to `https://localhost:3000` initially if frontend is not yet deployed
- Update `CLIENT_URL` to the actual Vercel URL after frontend deployment (Step 4)
- All variable names are CASE-SENSITIVE
- Do NOT use quotes around values in Railway's UI

### 2.4 Deploy Backend

1. Click "Deploy" in Railway
2. Wait for the deployment to complete
3. Railway will provide a URL like: `https://your-backend-name.up.railway.app`
4. Copy this URL - you'll need it for Vercel configuration

### 2.5 Verify Backend Deployment

Test your backend health endpoint:
```bash
# Test health endpoint
curl https://your-backend-name.up.railway.app/api/health

# Expected response: {"status":"ok","message":"Server is running"}
```

**If the health check fails:**
1. Check Railway deployment logs for errors
2. Verify all environment variables are set correctly
3. Ensure Supabase credentials are valid
4. Check that the backend is not in a crashed state
5. Try redeploying from Railway dashboard

### 2.6 Test Backend API Endpoints

Before proceeding, test critical backend endpoints:
```bash
# Test health
curl https://your-backend-name.up.railway.app/api/health

# Test CORS (should return 404 or appropriate error for non-existent route)
curl -H "Origin: https://your-vercel-url.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://your-backend-name.up.railway.app/api/test
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

Go to "Settings" > "Environment Variables" and add these variables **EXACTLY** as shown:

```env
VITE_API_URL=https://your-backend-name.up.railway.app
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**CRITICAL NOTES:**
- Replace `your-backend-name.up.railway.app` with your ACTUAL Railway backend URL from Step 2.4
- All Vite environment variables MUST start with `VITE_` prefix
- Variable names are CASE-SENSITIVE
- Set these for ALL environments (Production, Preview, Development)
- Click "Save" after adding each variable
- Redeploy after adding environment variables

### 3.4 Update Vercel Configuration

After deploying the backend and getting its URL, update `vercel.json`:

1. Open `vercel.json` in your repository
2. Replace ALL occurrences of `your-railway-backend-url.railway.app` with your actual Railway backend URL
3. Commit and push the changes:
   ```bash
   git add vercel.json
   git commit -m "Update Vercel config with Railway backend URL"
   git push origin main
   ```
4. Vercel will automatically redeploy with the new configuration

**IMPORTANT**: The rewrites in vercel.json are critical for:
- API proxying to Railway backend
- File upload handling
- WebSocket support
- SPA routing

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
4. Click "Save"
5. Redeploy the backend (click "Redeploy" button)
6. Wait for redeployment to complete

**CRITICAL**: The `CLIENT_URL` MUST match your Vercel URL exactly (including https:// and no trailing slash) for CORS to work properly.

**For University Domains:**
If deploying to a university subdomain (e.g., `events.university.edu`), set:
```env
CLIENT_URL=https://events.university.edu
```

## Step 5: Configure Supabase

### 5.1 Update Supabase CORS Settings

1. Go to Supabase Dashboard
2. Navigate to "Authentication" > "URL Configuration"
3. Add your Vercel URL to "Site URL" (e.g., `https://your-project.vercel.app`)
4. Add your Vercel URL to "Redirect URLs"
5. Click "Save"

**For University Domains:**
If using a custom university domain, add:
- Site URL: `https://events.university.edu`
- Redirect URLs: `https://events.university.edu/**`

**IMPORTANT**: Supabase requires exact URL matching for authentication to work correctly.

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
# Test health endpoint
curl https://your-backend-name.up.railway.app/api/health

# Expected response: {"status":"ok","message":"Server is running"}
```

### 7.2 Test Frontend

1. Open your Vercel URL in a browser
2. Test authentication flow (login/logout)
3. Test event creation and registration
4. Test file uploads
5. Test real-time features (WebSocket)
6. Test all navigation routes
7. Test on multiple browsers (Chrome, Firefox, Safari)

### 7.3 Check Browser Console

Open browser DevTools (F12) and check for:
- CORS errors
- Network request failures
- WebSocket connection issues
- JavaScript errors
- Missing environment variables

### 7.4 Test Network Connectivity

```bash
# Test connectivity from your network (university environment)
# Run these commands to verify outbound access

# Test Vercel connectivity
curl -I https://vercel.com

# Test Railway connectivity
curl -I https://railway.app

# Test Supabase connectivity
curl -I https://supabase.com

# If any fail, check with university IT department
```

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
1. Verify `CLIENT_URL` in Railway matches your Vercel URL exactly (including https:// and no trailing slash)
2. Check backend CORS configuration in `server.js`
3. Ensure Railway backend is deployed and accessible
4. Clear browser cache and cookies
5. Test in incognito/private mode
6. Check browser console for specific CORS error messages

**University Network Specific**:
- If behind a university proxy, CORS may be blocked
- Contact IT department to whitelist domains
- Test from a different network (e.g., mobile hotspot) to isolate the issue

### Environment Variables Not Loading

**Problem**: Application fails to start or missing config

**Solution**:
1. Verify all required environment variables are set in both platforms
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding environment variables
4. Check Railway and Vercel logs for specific errors
5. Ensure no spaces before/after variable values
6. Verify Vite variables have `VITE_` prefix in Vercel

### WebSocket Connection Issues

**Problem**: Real-time features not working

**Solution**:
1. Verify Railway backend allows WebSocket connections
2. Check if your Railway plan supports WebSockets
3. Update Vercel rewrites to handle WebSocket traffic
4. Test WebSocket connection directly to Railway URL
5. Check university firewall allows WebSocket (port 443)
6. Verify socket.io client version matches server version

**University Network Specific**:
- Some university firewalls block WebSocket connections
- Request IT department to allow WebSocket traffic
- Consider using long-polling as fallback if WebSocket is blocked

### Build Failures

**Problem**: Vercel or Railway build fails

**Solution**:
1. Check build logs for specific errors
2. Ensure all dependencies are in package.json
3. Verify Node.js version compatibility (use Node.js 18+)
4. Test build locally: `npm run build`
5. Check for missing or outdated dependencies
6. Verify .gitignore doesn't exclude necessary files

**Common Build Errors**:
- "Module not found": Check import paths and dependencies
- "TypeScript errors": Run `npm run lint` locally first
- "Out of memory": Increase memory limits in build settings

### Database Connection Issues

**Problem**: Backend can't connect to Supabase

**Solution**:
1. Verify Supabase URL and keys are correct
2. Check Supabase project is not paused
3. Ensure `exec_sql` function exists in Supabase
4. Test connection from Railway console
5. Verify Supabase allows connections from Railway IP ranges
6. Check Supabase project region and latency

### University Network/Proxy Issues

**Problem**: Application not accessible from university network

**Solution**:
1. Test from external network (mobile data) to isolate issue
2. Check university firewall rules
3. Verify DNS resolution for deployed domains
4. Contact IT department to whitelist required domains:
   - `*.vercel.app`
   - `*.railway.app`
   - `*.supabase.co`
5. Check if proxy server requires authentication
6. Test with VPN if available

### SSL/HTTPS Issues

**Problem**: Mixed content errors or certificate warnings

**Solution**:
1. Ensure all resources use HTTPS
2. Check for hardcoded HTTP URLs in code
3. Verify SSL certificates are valid (automatic on Vercel/Railway)
4. Clear SSL state in browser
5. Check system date/time is correct

### Performance Issues

**Problem**: Slow loading or timeouts

**Solution**:
1. Check Railway resource limits (upgrade if needed)
2. Optimize database queries in Supabase
3. Enable caching in backend
4. Check for large file uploads
5. Monitor bandwidth usage
6. Consider CDN for static assets

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
2. **Use strong JWT secrets** (minimum 32 characters, use crypto to generate)
3. **Enable HTTPS** on both platforms (automatic on Vercel/Railway)
4. **Rotate secrets regularly** (every 90 days recommended)
5. **Monitor logs** for suspicious activity
6. **Keep dependencies updated** (run `npm audit` regularly)
7. **Use Supabase RLS** for database security
8. **Enable rate limiting** (already configured in backend)
9. **Implement IP whitelisting** if possible for university environments
10. **Use environment-specific secrets** (different for dev/staging/prod)
11. **Enable 2FA** on Vercel, Railway, and Supabase accounts
12. **Regular backups** of Supabase database (automatic on Supabase free tier)

## University-Specific Security Considerations

### Data Privacy
- Ensure compliance with university data privacy policies
- Review FERPA/GDPR requirements if handling student data
- Implement proper data retention policies
- Secure file uploads with proper validation

### Access Control
- Implement role-based access control (RBAC)
- Use university SSO if available (requires additional integration)
- Regular audit of user access
- Implement session timeout policies

### Network Security
- Ensure all traffic uses HTTPS
- Implement CSP (Content Security Policy) headers
- Use secure cookies with HttpOnly and Secure flags
- Implement CSRF protection

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
   - Verify health endpoint after deployment

3. **Vercel will auto-deploy frontend**
   - Monitor deployment in Vercel dashboard
   - Check build logs for errors
   - Test frontend functionality after deployment

### Database Migrations

For database changes:
1. Run migration scripts in Supabase SQL Editor
2. Test in development/staging environment first
3. Apply to production during low-traffic periods
4. Backup database before major changes
5. Document all migrations for rollback purposes

### Rollback Procedures

If deployment causes issues:

**Frontend Rollback (Vercel):**
1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Find the previous successful deployment
4. Click "Promote to Production"

**Backend Rollback (Railway):**
1. Go to Railway dashboard
2. Navigate to "Deployments"
3. Find the previous successful deployment
4. Click "Redeploy" on that version

**Database Rollback (Supabase):**
1. Use Supabase point-in-time recovery (if available)
2. Restore from backup if needed
3. Revert migration scripts manually

## Environment Validation

### Pre-Deployment Validation Script

Create a validation script to check environment configuration:

```bash
#!/bin/bash
# validate-deployment.sh

echo "Validating deployment configuration..."

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Check if .env files are gitignored
if grep -q ".env" .gitignore; then
    echo "✓ .env files are in .gitignore"
else
    echo "✗ ERROR: .env files not in .gitignore"
    exit 1
fi

# Check if required config files exist
if [ -f "vercel.json" ]; then
    echo "✓ vercel.json exists"
else
    echo "✗ ERROR: vercel.json missing"
    exit 1
fi

if [ -f "backend/railway.json" ]; then
    echo "✓ backend/railway.json exists"
else
    echo "✗ ERROR: backend/railway.json missing"
    exit 1
fi

# Test local build
echo "Testing local build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✓ Local build successful"
else
    echo "✗ ERROR: Local build failed"
    exit 1
fi

echo "Validation complete!"
```

Run this before every deployment:
```bash
chmod +x validate-deployment.sh
./validate-deployment.sh
```

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

### Infrastructure
- [ ] Backend deployed successfully on Railway
- [ ] Frontend deployed successfully on Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL/HTTPS enabled (automatic on both platforms)

### Backend Verification
- [ ] Backend health check returns 200 OK
- [ ] Environment variables set correctly in Railway
- [ ] Supabase database accessible from backend
- [ ] CORS configured with correct CLIENT_URL
- [ ] WebSocket connections established (test real-time features)

### Frontend Verification
- [ ] Frontend loads without errors
- [ ] Environment variables set correctly in Vercel
- [ ] API calls succeed from frontend
- [ ] Authentication flow works (login/logout)
- [ ] File uploads work correctly
- [ ] All navigation routes work
- [ ] No console errors in browser

### Database Verification
- [ ] Supabase RLS policies enabled
- [ ] Supabase CORS settings configured
- [ ] Database tables accessible
- [ ] Backup strategy in place

### University Network Verification
- [ ] Application accessible from university network
- [ ] Required domains whitelisted by IT
- [ ] Firewall allows WebSocket connections
- [ ] Proxy configuration tested (if applicable)
- [ ] DNS resolution working for deployed domains

### Security Verification
- [ ] JWT secret is strong (32+ characters)
- [ ] Rate limiting enabled
- [ ] HTTPS enforced everywhere
- [ ] No .env files committed to git
- [ ] 2FA enabled on all platform accounts

### Monitoring & Maintenance
- [ ] Monitoring and logging set up
- [ ] Error tracking configured
- [ ] Rollback procedures documented
- [ ] Team members have access credentials
- [ ] Deployment workflow tested

### Documentation
- [ ] This deployment guide followed
- [ ] Environment variables documented
- [ ] Backup procedures documented
- [ ] Contact information for platform support saved

## Quick Start Summary (For Reference)

**Deployment Order:**
1. Complete pre-deployment checklist (Step 0)
2. Deploy backend to Railway (Step 2)
3. Deploy frontend to Vercel (Step 3)
4. Update Railway CORS with Vercel URL (Step 4)
5. Configure Supabase (Step 5)
6. Test everything thoroughly (Step 7)

**Critical URLs to Save:**
- Railway Backend URL: `https://your-backend-name.up.railway.app`
- Vercel Frontend URL: `https://your-project-name.vercel.app`
- Supabase Dashboard: `https://app.supabase.com`

**Critical Environment Variables:**
- Railway: `NODE_ENV`, `PORT`, `CLIENT_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- Vercel: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Common Issues & Quick Fixes:**
- CORS errors: Check CLIENT_URL matches exactly
- Build failures: Run `npm run build` locally first
- WebSocket issues: Check university firewall
- Env variables not loading: Check case sensitivity and VITE_ prefix

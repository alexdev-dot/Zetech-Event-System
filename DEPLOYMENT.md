# Zetech Event System - Deployment Guide

This guide provides comprehensive instructions for deploying the Zetech Event System to various production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
   - [VPS Deployment (Ubuntu)](#vps-deployment-ubuntu)
   - [Docker Deployment](#docker-deployment)
   - [Cloud Platform Deployment](#cloud-platform-deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [PM2 Process Management](#pm2-process-management)
7. [SSL/HTTPS Setup](#sslhttps-setup)
8. [Monitoring and Logs](#monitoring-and-logs)
9. [Backup and Restore](#backup-and-restore)
10. [Performance Optimization](#performance-optimization)
11. [Troubleshooting](#troubleshooting)
12. [Security Hardening](#security-hardening)

## Prerequisites

- Node.js v18 or higher
- npm package manager
- Git
- Supabase account with project configured
- Domain name (optional but recommended for production)
- Basic knowledge of Linux commands (for VPS deployment)

## Environment Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Zetech-Event-System
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables

```bash
# Copy example environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Edit .env files with your actual values
nano .env
nano backend/.env
```

**Frontend (.env) Variables:**
```env
# API URL for backend (where the backend server is running)
VITE_API_URL=http://localhost:3001

# Supabase Configuration (for frontend client)
# Get these from your Supabase project dashboard: https://supabase.com/dashboard
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anonymous_key
```

**Backend (backend/.env) Variables:**
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Supabase Configuration (for backend service role access)
# Get these from your Supabase project dashboard: https://supabase.com/dashboard
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret (IMPORTANT: Generate a secure random string at least 32 characters)
# You can generate one using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_secure_jwt_secret_at_least_32_characters

# Client URL (for CORS configuration - your frontend URL in production)
CLIENT_URL=https://your-domain.com

# Africa's Talking SMS Configuration (Optional - for SMS notifications)
# Get these from: https://africastalking.com/
# Leave these blank if you don't want SMS functionality
AT_API_KEY=
AT_USERNAME=sandbox
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Setup

### Supabase Database Configuration

Before running the application, you need to set up the Supabase database:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Run the SQL from `backend/setup_exec_sql.sql` (creates the exec_sql function for RPC queries)
5. Run the SQL from `backend/schema.sql` (creates all database tables and triggers)

### Verify Database Setup

After running the SQL scripts, verify the setup by checking:

1. **exec_sql function exists**: In Supabase SQL Editor, run:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'exec_sql';
   ```

2. **Tables created**: Check that these tables exist:
   - `student_registrations`
   - `admins`
   - `events`
   - `event_registrations`
   - `event_polls`
   - `event_poll_votes`

## Deployment Options

### VPS Deployment (Ubuntu)

This is the recommended deployment method for maximum control and performance.

#### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

#### Step 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node --version  # Should be v18.x or higher
npm --version
```

#### Step 3: Install PM2

```bash
sudo npm install -g pm2
```

#### Step 4: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 5: Install Git

```bash
sudo apt install -y git
```

#### Step 6: Configure Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

#### Step 7: Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone <your-repository-url> zetech-event-system
cd zetech-event-system

# Set proper permissions
sudo chown -R $USER:$USER /var/www/zetech-event-system

# Install dependencies
npm install
cd backend
npm install
cd ..

# Build frontend
npm run build

# Configure environment variables
nano .env
nano backend/.env
```

#### Step 8: Start with PM2

```bash
# Start backend server
pm2 start backend/server.js --name "zetech-backend"

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

#### Step 9: Configure Nginx

See [Nginx Configuration](#nginx-configuration) section below.

#### Step 10: Test Deployment

```bash
# Check PM2 status
pm2 status

# Check backend logs
pm2 logs zetech-backend

# Test API health
curl http://localhost:3001/api/health
```

### Docker Deployment

Docker deployment provides consistent environments and easy scaling.

#### Build Docker Image

```bash
docker build -t zetech-event-system:latest .
```

#### Run Docker Container

```bash
docker run -d \
  --name zetech-event-system \
  -p 3001:3001 \
  --env-file backend/.env \
  --restart unless-stopped \
  zetech-event-system:latest
```

#### Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: zetech-event-system
    ports:
      - "3001:3001"
    env_file:
      - backend/.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    volumes:
      - ./backend/public/uploads:/app/backend/public/uploads
    networks:
      - zetech-network

networks:
  zetech-network:
    driver: bridge
```

Run with Docker Compose:

```bash
docker-compose up -d
```

#### Docker Management Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update and rebuild
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Cloud Platform Deployment

#### Option 1: Railway

1. Connect your GitHub repository to Railway
2. Railway will automatically detect it's a Node.js project
3. Add environment variables in Railway dashboard:
   - `NODE_ENV=production`
   - `PORT=3001`
   - All other variables from backend/.env.example
4. Railway will build and deploy automatically

#### Option 2: Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install && cd backend && npm install && cd .. && npm run build`
4. Set start command: `node backend/server.js`
5. Add environment variables in Render dashboard
6. Deploy

#### Option 3: Heroku

1. Create a new Heroku app
2. Add buildpacks:
   - heroku/nodejs
3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=3001
   # Set all other required variables
   ```
4. Deploy:
   ```bash
   heroku create
   git push heroku main
   ```

## Nginx Configuration

### Basic Configuration

Create `/etc/nginx/sites-available/zetech-event-system`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File uploads
    client_max_body_size 10M;

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Configuration

```bash
sudo ln -s /etc/nginx/sites-available/zetech-event-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Remove Default Nginx Site

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl reload nginx
```

## PM2 Process Management

### Basic PM2 Commands

```bash
# Start application
pm2 start backend/server.js --name "zetech-backend"

# View status
pm2 status

# View logs
pm2 logs zetech-backend

# Restart application
pm2 restart zetech-backend

# Stop application
pm2 stop zetech-backend

# Delete application
pm2 delete zetech-backend

# Monitor
pm2 monit
```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'zetech-backend',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

Start with ecosystem file:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### PM2 Cluster Mode (Multi-Core)

For servers with multiple CPU cores:

```javascript
module.exports = {
  apps: [{
    name: 'zetech-backend',
    script: './backend/server.js',
    instances: 'max', // or specific number like 4
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Manual SSL Configuration

If you have SSL certificates:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3001;
        # ... same proxy configuration as above
    }
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring and Logs

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs zetech-backend --lines 100

# Log rotation
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Log rotation (logrotate)
sudo logrotate /etc/logrotate.conf
```

### Application Logs

```bash
# Backend logs
tail -f logs/out.log
tail -f logs/err.log

# Create logs directory if it doesn't exist
mkdir -p logs
```

### System Monitoring

```bash
# Check system resources
htop

# Check disk space
df -h

# Check memory usage
free -m

# Check running processes
ps aux
```

## Backup and Restore

### Database Backup

Supabase provides automatic backups, but you can also export manually:

1. Go to Supabase Dashboard
2. Navigate to Database > Backups
3. Click "Export" to download SQL dump

### Application Backup

```bash
# Backup application files
cd /var/www
sudo tar -czf zetech-event-system-backup-$(date +%Y%m%d).tar.gz zetech-event-system/

# Backup environment files (securely)
sudo tar -czf zetech-env-backup-$(date +%Y%m%d).tar.gz zetech-event-system/.env zetech-event-system/backend/.env

# Upload to secure storage (S3, etc.)
```

### Restore Procedure

```bash
# Stop application
pm2 stop zetech-backend

# Restore application files
cd /var/www
sudo tar -xzf zetech-event-system-backup-YYYYMMDD.tar.gz

# Restore environment files
sudo tar -xzf zetech-env-backup-YYYYMMDD.tar.gz

# Restore database in Supabase SQL Editor
# Run the exported SQL dump

# Restart application
pm2 restart zetech-backend
```

## Performance Optimization

### Nginx Optimization

```nginx
# Add to nginx configuration
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=1g inactive=60m;
```

### PM2 Optimization

```bash
# Increase max memory limit
pm2 set max_memory_restart 2G

# Enable cluster mode for multi-core
pm2 reload ecosystem.config.js --update-env
```

### Database Optimization

1. Add indexes to frequently queried columns
2. Use connection pooling (already handled by Supabase)
3. Optimize slow queries using Supabase Query Performance insights
4. Enable Row Level Security (RLS) for better performance

### Application Optimization

1. Enable gzip compression (already configured in backend)
2. Use CDN for static assets
3. Implement caching strategies
4. Optimize images and assets
5. Use lazy loading for components

## Troubleshooting

### Backend Won't Start

1. Check environment variables are set correctly
2. Verify JWT_SECRET is at least 32 characters
3. Check Supabase credentials are valid
4. Verify database setup by running `backend/setup_exec_sql.sql`
5. Check port 3001 is not already in use: `sudo lsof -i :3001`

### Frontend Build Errors

1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Check Node.js version (requires v18+): `node --version`
3. Verify environment variables in `.env`
4. Check for TypeScript errors: `npm run lint`

### Database Connection Issues

1. Verify Supabase URL and keys are correct
2. Ensure `exec_sql` function is created in Supabase
3. Check Supabase project is not paused
4. Verify network connectivity: `ping supabase.com`
5. Check Supabase status page: https://status.supabase.com

### CORS Errors

1. Check `CLIENT_URL` in backend/.env matches your frontend URL
2. Verify Nginx proxy headers are configured correctly
3. Check browser console for specific error messages
4. Ensure backend is running and accessible

### File Upload Issues

1. Check `client_max_body_size` in Nginx configuration
2. Verify upload directory permissions: `ls -la backend/public/uploads`
3. Check disk space on server: `df -h`
4. Ensure Multer configuration allows the file type

### PM2 Issues

```bash
# PM2 won't start on boot
pm2 delete zetech-backend
pm2 start backend/server.js --name "zetech-backend"
pm2 save

# PM2 logs not showing
pm2 install pm2-logrotate
pm2 flush zetech-backend
```

### Nginx Issues

```bash
# Nginx won't start
sudo nginx -t  # Test configuration
sudo systemctl status nginx  # Check status
sudo journalctl -u nginx  # View logs

# 502 Bad Gateway
# Check if backend is running
pm2 status
curl http://localhost:3001/api/health
```

## Security Hardening

### Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Fail2Ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Application Security

1. **Environment Variables**: Never commit `.env` files to version control
2. **JWT Secrets**: Use strong secrets (minimum 32 characters)
3. **HTTPS**: Always enable HTTPS in production
4. **Dependencies**: Keep updated: `npm audit fix`
5. **Rate Limiting**: Already configured in backend (express-rate-limit)
6. **Security Headers**: Already configured (Helmet.js)
7. **Input Validation**: Already configured (Zod schema validation)

### Server Security

```bash
# Disable root SSH login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh

# Install and configure fail2ban
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Regular system updates
sudo apt update && sudo apt upgrade -y
```

### Database Security

1. Use Supabase Row Level Security (RLS)
2. Regularly rotate service role keys
3. Use least privilege principle for database users
4. Enable database backups
5. Monitor database access logs

## Update and Maintenance

### Update Application

```bash
cd /var/www/zetech-event-system
git pull origin main
npm install
cd backend
npm install
cd ..
npm run build
pm2 restart zetech-backend
```

### Database Migrations

Run migration scripts in Supabase SQL editor as needed.

### Regular Maintenance Tasks

```bash
# Weekly
- Check system logs
- Review PM2 logs for errors
- Check disk space
- Review security logs

# Monthly
- Update dependencies
- Review and update SSL certificates
- Test backup restoration
- Review performance metrics

# Quarterly
- Security audit
- Performance review
- Disaster recovery test
- Update documentation
```

## Support

For issues or questions:
- Check Supabase dashboard for database issues
- Review PM2 logs for application errors
- Check Nginx logs for proxy issues
- Verify environment variables are correctly set
- Check application logs: `pm2 logs zetech-backend`
- Review documentation in README.md and MIGRATION_REPORT.md

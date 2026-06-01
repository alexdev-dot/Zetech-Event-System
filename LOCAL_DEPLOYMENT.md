# Local Deployment Guide

This guide explains how to run the Zetech Event System locally on your machine or a traditional server.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase account with project configured
- Text editor (VS Code recommended)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/alexdev-dot/Zetech-Event-System.git
cd Zetech-Event-System
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend Environment Variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

Create a `.env` file in the `backend` directory:

```env
# Backend Environment Variables
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173

# JWT Secret (generate a secure one)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

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

### 5. Start Backend Server

```bash
cd backend
npm start
```

The backend will run on `http://localhost:3001`

### 6. Start Frontend Development Server

In a new terminal:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Production Deployment on Traditional Server

### Option 1: Using PM2 (Recommended)

1. **Install PM2 globally:**
```bash
npm install -g pm2
```

2. **Build the frontend:**
```bash
npm run build
```

3. **Start backend with PM2:**
```bash
cd backend
pm2 start server.js --name zetech-backend
pm2 save
pm2 startup
```

4. **Serve frontend with a web server:**
```bash
# Install a simple HTTP server
npm install -g serve

# Serve the built frontend
cd ..
serve -s dist -l 80
```

### Option 2: Using Nginx

1. **Build the frontend:**
```bash
npm run build
```

2. **Start backend with PM2:**
```bash
cd backend
pm2 start server.js --name zetech-backend
pm2 save
pm2 startup
```

3. **Configure Nginx:**

Create `/etc/nginx/sites-available/zetech-event`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/Zetech-Event-System/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads {
        proxy_pass http://localhost:3001;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/zetech-event /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 3: Using Apache

1. **Build the frontend:**
```bash
npm run build
```

2. **Start backend with PM2:**
```bash
cd backend
pm2 start server.js --name zetech-backend
pm2 save
pm2 startup
```

3. **Configure Apache:**

Create `/etc/apache2/sites-available/zetech-event.conf`:

```apache
<VirtualHost *:80>
    ServerName your-domain.com

    # Frontend
    DocumentRoot /path/to/Zetech-Event-System/dist

    <Directory /path/to/Zetech-Event-System/dist>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Backend API Proxy
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api

    # File uploads
    ProxyPass /uploads http://localhost:3001/uploads
    ProxyPassReverse /uploads http://localhost:3001/uploads

    # WebSocket
    ProxyPass /socket.io http://localhost:3001/socket.io
    ProxyPassReverse /socket.io http://localhost:3001/socket.io
</VirtualHost>
```

4. **Enable the site:**
```bash
sudo a2ensite zetech-event
sudo a2enmod proxy proxy_http rewrite
sudo systemctl restart apache2
```

## Environment Variables for Production

Update `.env` files for production:

**Root `.env`:**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://your-domain.com
```

**Backend `.env`:**
```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-domain.com
JWT_SECRET=your_secure_jwt_secret
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=sandbox
```

## Database Setup

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Run the SQL setup script from `backend/setup_exec_sql.sql`
4. Configure Row Level Security (RLS) policies
5. Add your domain to Supabase Authentication settings

## Troubleshooting

### Backend won't start
- Check if port 3001 is already in use
- Verify all environment variables are set
- Check backend logs: `pm2 logs zetech-backend`

### Frontend won't load
- Ensure backend is running
- Check API_URL in environment variables
- Verify Supabase credentials

### CORS errors
- Ensure CLIENT_URL matches your frontend URL exactly
- Check backend CORS configuration in `server.js`

### WebSocket issues
- Verify firewall allows WebSocket connections
- Check if proxy server supports WebSocket upgrades

## Security Best Practices

1. Never commit `.env` files to version control
2. Use strong JWT secrets (minimum 32 characters)
3. Enable HTTPS in production (use Let's Encrypt)
4. Keep dependencies updated
5. Monitor logs regularly
6. Implement rate limiting (already configured in backend)
7. Use Supabase RLS for database security

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs zetech-backend
pm2 status
```

### Log Files
- Backend logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- Apache logs: `/var/log/apache2/`

## Support

- **Supabase Docs**: https://supabase.com/docs
- **PM2 Docs**: https://pm2.keymetrics.io/docs
- **Project README**: See README.md for application details

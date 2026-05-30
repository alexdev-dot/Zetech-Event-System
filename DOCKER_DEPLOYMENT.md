# Docker Deployment Guide

This guide explains how to deploy the Zetech Event System using Docker, making it independent of your personal computer configuration.

## Prerequisites

- Docker installed on your server (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)
- A Supabase project (for database)
- At least 2GB RAM and 10GB disk space

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd Zetech-Event-System
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Build and start the application:**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application:**
   - Open your browser and navigate to `http://your-server-ip:3001`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Frontend Environment Variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Environment Variables
NODE_ENV=production
PORT=3001
CLIENT_URL=http://your-domain-or-ip:3001

# JWT Secret (must be at least 32 characters - generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Africa's Talking SMS (Optional - for SMS notifications)
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=sandbox
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Navigate to Project Settings → API
4. Copy the following:
   - Project URL → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### Setting up Supabase Database

Before deploying, you need to set up your Supabase database:

1. Go to your Supabase project's SQL Editor
2. Run the SQL from `backend/setup_exec_sql.sql` to create the `exec_sql` function
3. Run the SQL from `backend/schema.sql` to create all required tables

## Docker Commands

### Build and Start
```bash
docker-compose up -d --build
```

### Stop the Application
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart the Application
```bash
docker-compose restart
```

### Update the Application
```bash
git pull
docker-compose up -d --build
```

## Production Deployment

### Using a Reverse Proxy (Recommended)

For production, use Nginx as a reverse proxy with SSL:

1. **Install Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx
   ```

2. **Configure Nginx:**
   Create `/etc/nginx/sites-available/zetech-events`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /socket.io/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/zetech-events /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Enable SSL:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

5. **Update CLIENT_URL in .env:**
   ```bash
   CLIENT_URL=https://your-domain.com
   ```

### Using Cloud Providers

#### AWS EC2
1. Launch an EC2 instance (Ubuntu 20.04 or 22.04)
2. Install Docker and Docker Compose
3. Clone the repository
4. Configure environment variables
5. Run `docker-compose up -d --build`
6. Configure security group to allow port 3001

#### DigitalOcean
1. Create a Droplet with Docker installed
2. SSH into the droplet
3. Clone the repository
4. Configure environment variables
5. Run `docker-compose up -d --build`

#### Google Cloud Platform
1. Create a Compute Engine instance
2. Install Docker and Docker Compose
3. Clone the repository
4. Configure environment variables
5. Run `docker-compose up -d --build`

## Monitoring and Maintenance

### Check Container Status
```bash
docker-compose ps
```

### View Resource Usage
```bash
docker stats
```

### Access Container Shell
```bash
docker-compose exec app sh
```

### Backup Database
Since you're using Supabase, use their built-in backup features:
- Go to Supabase Dashboard → Database → Backups
- Enable automated backups

### Update Application
```bash
git pull origin main
docker-compose up -d --build
```

## Troubleshooting

### Container won't start
```bash
docker-compose logs app
```

### Database connection issues
- Verify Supabase credentials in `.env`
- Check if Supabase project is active
- Ensure `exec_sql` function is created in Supabase

### Port already in use
Change the port in `docker-compose.yml`:
```yaml
ports:
  - "8080:3001"  # Change 3001 to your desired port
```

### Permission issues with uploads
The uploads directory is mounted as a volume. Ensure proper permissions:
```bash
sudo chown -R 1001:1001 backend/public/uploads
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Enable SSL/TLS** in production
4. **Keep Docker updated** on your server
5. **Regularly update dependencies** by rebuilding the image
6. **Use firewall rules** to restrict access
7. **Monitor logs** for suspicious activity
8. **Backup your Supabase database** regularly

## Performance Optimization

1. **Use a CDN** for static assets
2. **Enable gzip compression** (already configured in the app)
3. **Use Redis for caching** (optional, for high traffic)
4. **Scale horizontally** using Docker Swarm or Kubernetes if needed

## Support

For issues or questions:
- Check the logs: `docker-compose logs -f`
- Review the main README.md
- Check Supabase dashboard for database issues

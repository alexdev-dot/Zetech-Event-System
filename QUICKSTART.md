# Quick Start Guide - Run Anywhere with Docker

This guide shows you how to run the Zetech Event System on any computer using Docker, without needing Node.js or any local dependencies.

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)
- A Supabase project (free tier works fine)

## 5-Minute Setup

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd Zetech-Event-System
```

### Step 2: Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```bash
# Get these from https://supabase.com/dashboard -> Project Settings -> API
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Generate a secure JWT secret (min 32 characters)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Set your server URL
CLIENT_URL=http://localhost:3001
```

### Step 3: Set Up Supabase Database
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Run the SQL from `backend/setup_exec_sql.sql`
5. Run the SQL from `backend/schema.sql`

### Step 4: Run with Docker
```bash
docker-compose up -d --build
```

### Step 5: Access the Application
Open your browser to: `http://localhost:3001`

## Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d --build` | Build and start the application |
| `docker-compose down` | Stop the application |
| `docker-compose logs -f` | View logs in real-time |
| `docker-compose restart` | Restart the application |
| `docker-compose ps` | Check container status |
| `docker-compose exec app sh` | Access container shell |

## Troubleshooting

### Port Already in Use
If port 3001 is already in use, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:3001"  # Change to your preferred port
```

### Container Won't Start
```bash
docker-compose logs app
```

### Database Connection Issues
- Verify your Supabase credentials in `.env`
- Ensure Supabase project is active
- Check that you've run the SQL setup scripts

### Permission Issues
If you get permission errors with file uploads:
```bash
sudo chown -R 1001:1001 backend/public/uploads
```

## Deploying to a Server

To deploy to any server (AWS, DigitalOcean, etc.):

1. **Install Docker** on your server
2. **Clone the repository**
3. **Configure `.env`** with your production credentials
4. **Run:** `docker-compose up -d --build`
5. **Set up a reverse proxy** (Nginx recommended) with SSL

See `DOCKER_DEPLOYMENT.md` for detailed server deployment instructions.

## That's It!

Your application is now running in a Docker container and can be deployed anywhere Docker is installed - no Node.js or local dependencies required!

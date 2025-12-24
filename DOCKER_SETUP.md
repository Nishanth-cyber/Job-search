# Docker Setup Guide

This guide explains how to dockerize your full-stack application using Docker and Docker Compose.

## 📁 Recommended Project Structure

```
Job-search-main/
├── React+vite/              # Frontend application
│   ├── Dockerfile           # Frontend multi-stage build (Node + Nginx)
│   ├── nginx.conf           # Nginx configuration for serving React app
│   ├── .dockerignore        # Files to exclude from Docker build context
│   ├── src/
│   ├── package.json
│   └── ...
├── Springboot/              # Backend application
│   ├── Dockerfile           # Backend multi-stage build (Maven + OpenJDK)
│   ├── .dockerignore        # Files to exclude from Docker build context
│   ├── pom.xml
│   ├── src/
│   └── ...
├── docker-compose.yml       # Orchestrates both services
├── .env.example            # Environment variables template
└── .env                    # Your actual environment variables (create this)
```

## 🐳 Docker Files Explanation

### Frontend Dockerfile (`React+vite/Dockerfile`)

**Stage 1: Builder (Node.js)**
- Uses `node:20-alpine` image (lightweight Alpine Linux)
- Installs dependencies and builds the React app with Vite
- Outputs optimized production build in `/app/dist`

**Stage 2: Runtime (Nginx)**
- Uses `nginx:alpine` image (much smaller than Node)
- Copies only the built static files from Stage 1
- Serves the app on port 80 (mapped to host port 3000)

**Why Multi-Stage?**
- Final image is ~10x smaller (Alpine Nginx ~25MB vs Node ~300MB)
- No build tools in production image (security + size)
- Faster image pulls and deployments

### Backend Dockerfile (`Springboot/Dockerfile`)

**Stage 1: Builder (Maven)**
- Uses `maven:3.9-eclipse-temurin-21` image
- Downloads dependencies (cached layer)
- Compiles Java code and packages into JAR

**Stage 2: Runtime (OpenJDK)**
- Uses `eclipse-temurin:21-jre-alpine` (JRE only, no JDK)
- Runs as non-root user (`spring`) for security
- Executes the JAR file

**Why Multi-Stage?**
- Final image ~100MB vs ~800MB with Maven
- Only runtime dependencies included
- More secure (no build tools, non-root user)

### Docker Compose (`docker-compose.yml`)

**Services:**
1. **frontend**: React app served via Nginx on port 3000
2. **backend**: Spring Boot app on port 8080

**Network:**
- Creates `app-network` bridge network
- Containers communicate using service names (`frontend`, `backend`)
- No need for `localhost` - Docker DNS resolves service names

**Why Docker Compose?**
- Single command to start all services
- Automatic networking between containers
- Dependency management (`depends_on`)
- Environment variable management
- Volume and network orchestration

### Nginx Configuration (`React+vite/nginx.conf`)

**Key Features:**
1. **Client-side routing**: `try_files $uri $uri/ /index.html` allows React Router to work
2. **API proxying**: Backend API endpoints (`/auth`, `/jobs`, `/me`, `/applications`, etc.) forwarded to `backend:8080`
3. **Caching**: Static assets cached for 1 year
4. **Gzip compression**: Reduces file sizes
5. **Security headers**: XSS protection, content-type validation

**Why Proxy Backend Requests?**
- **Browser limitation**: JavaScript running in the browser cannot resolve Docker service names (like `backend:8080`)
- **Solution**: Nginx (running in the frontend container) can resolve service names and proxies requests
- **Benefits**: 
  - Frontend uses relative URLs (same origin)
  - Avoids CORS issues
  - Single origin for frontend (simpler security)
  - Can add rate limiting, authentication at proxy level

**How it works:**
1. Frontend makes API call to relative URL (e.g., `/auth/login`)
2. Browser sends request to Nginx (same origin)
3. Nginx proxies request to `backend:8080` (using Docker service name)
4. Backend processes request and returns response
5. Nginx forwards response back to frontend

## 🚀 Getting Started

### 1. Create Environment File

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and update:
- MongoDB connection string
- JWT secret (use a strong random string!)
- CORS allowed origins
- Any other configuration you need

### 2. Build and Run

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### 3. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:3000/health

## 🔧 Key Concepts Explained

### Multi-Stage Builds

**Problem:** Development images are large (contain build tools)
**Solution:** Use one image to build, another to run

```
Stage 1 (Builder) → Stage 2 (Runtime)
     ↓                    ↓
  Build tools        Production code only
  (Maven/Node)       (JAR/Static files)
```

**Benefits:**
- Smaller final images
- Faster deployments
- Better security (no build tools)
- Clear separation of concerns

### Docker Networking

**Service Discovery:**
- Containers on same network can communicate by service name
- Nginx (in frontend container) can reach backend via `http://backend:8080`
- Docker DNS automatically resolves service names to container IPs

**Why not `localhost` in frontend code?**
- Frontend JavaScript runs in the **browser** (user's machine), not in the container
- Browser cannot resolve Docker service names like `backend:8080`
- **Solution**: Use relative URLs in frontend, Nginx proxies to backend service

**Communication Flow:**
```
Browser → Nginx (frontend:80) → Backend Service (backend:8080)
         (same origin)          (Docker network)
```

**Why relative URLs?**
- Browser sees all requests as same origin (no CORS)
- Nginx handles routing to backend using Docker service names
- Works in both Docker and local development (with different nginx config if needed)

### Environment Variables

**In Docker Compose:**
- Defined in `environment:` section
- Can reference `.env` file using `${VARIABLE_NAME:-default}`
- Each service has its own environment

**Best Practices:**
- Never commit `.env` file (use `.env.example`)
- Use strong secrets in production
- Document all required variables

### .dockerignore Files

**Purpose:** Exclude files from Docker build context

**Benefits:**
- Faster builds (smaller context)
- Smaller images
- Avoid copying sensitive files
- Exclude build artifacts and dependencies

## 📊 Port Mapping

| Service | Container Port | Host Port | Access URL |
|---------|---------------|-----------|------------|
| Frontend (Nginx) | 80 | 3000 | http://localhost:3000 |
| Backend (Spring Boot) | 8080 | 8080 | http://localhost:8080 |

## 🔍 Troubleshooting

### Frontend can't reach backend

**Check:**
1. Both services on same network (`docker-compose ps`)
2. Backend is running (`docker-compose logs backend`)
3. Using service name, not `localhost` in frontend config

### Build fails

**Solutions:**
1. Clear Docker cache: `docker-compose build --no-cache`
2. Check `.dockerignore` isn't excluding needed files
3. Verify `Dockerfile` paths are correct

### Port already in use

**Solutions:**
1. Change ports in `docker-compose.yml`
2. Stop other services using those ports
3. Check: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (Linux/Mac)

### Backend won't start

**Check:**
1. MongoDB connection string is correct
2. Environment variables are set properly
3. Check logs: `docker-compose logs backend`

## 🎯 Production Considerations

1. **Use secrets management** (Docker secrets, AWS Secrets Manager, etc.)
2. **Enable HTTPS** (use reverse proxy like Traefik or Nginx)
3. **Set resource limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```
4. **Use Docker images from registry** instead of building locally
5. **Enable health checks** (already included in Dockerfiles)
6. **Use volumes for persistent data** (database, uploads)
7. **Set up logging** (use logging driver or external service)

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)


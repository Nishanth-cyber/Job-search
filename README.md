# Job Search Portal

A full-stack job search and recruitment platform with AI-powered features including resume analysis, skill assessments, and intelligent job matching.

## 🚀 Features

### For Job Seekers
- **Job Discovery**: Browse and search through available job listings
- **Resume Upload**: Upload and store your resume (PDF parsing)
- **AI Resume Analysis**: Get intelligent feedback on your resume with skill suggestions
- **Skill Assessment**: Take tailored tests for job applications
- **AI Interviews**: Practice interviews with AI-generated questions
- **Application Tracking**: Track your job applications and their status
- **Challenges**: Participate in coding/technical challenges
- **Profile Management**: Manage your profile and resume

### For Recruiters/Companies
- **Job Posting**: Create and manage job listings
- **Applicant Management**: Review and manage job applications
- **Smart Scoring**: AI-powered scoring of applications
- **Dashboard**: Comprehensive dashboard for job and application management
- **Challenge Creation**: Post technical challenges for candidates
- **Application Review**: Review candidate resumes, test scores, and analysis

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **LiveKit Client** - Real-time features (AI interviews)

### Backend
- **Spring Boot 3.5.6** - Java framework
- **Spring Security** - Authentication & authorization
- **Spring Data MongoDB** - Database integration
- **JWT** - Token-based authentication
- **MongoDB** - NoSQL database
- **Maven** - Build tool
- **Java 21** - Programming language

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server (production frontend)

### External Services
- **N8N** - AI-powered resume analysis and interview evaluation (optional)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Java 21+** (for local backend development)
- **Node.js 20+** and npm (for local frontend development)
- **Maven 3.9+** (for local backend builds)
- **MongoDB** (local or MongoDB Atlas connection string)
- **Docker Desktop** (for Docker setup)

## 🏗️ Project Structure

```
Job-search-main/
├── React+vite/              # Frontend application
│   ├── src/
│   │   ├── component/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── api.js           # API client configuration
│   │   └── ...
│   ├── Dockerfile           # Frontend Docker image
│   ├── nginx.conf           # Nginx configuration
│   └── package.json
├── Springboot/              # Backend application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── Springboot/
│   │   │   │       ├── config/      # Configuration classes
│   │   │   │       ├── controller/  # REST controllers
│   │   │   │       ├── model/       # Data models
│   │   │   │       ├── repository/  # Data repositories
│   │   │   │       ├── security/    # Security & JWT
│   │   │   │       └── service/     # Business logic
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── Dockerfile           # Backend Docker image
│   └── pom.xml
├── docker-compose.yml       # Docker Compose configuration
├── DOCKER_SETUP.md          # Detailed Docker documentation
└── README.md                # This file
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

The easiest way to run the application is using Docker Compose:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Job-search-main
   ```

2. **Create environment file (optional)**
   ```bash
   # Copy the template and edit with your values
   cp env.template .env
   ```
   
   Edit `.env` and set:
   - `SPRING_DATA_MONGODB_URI` - Your MongoDB connection string
   - `SECURITY_JWT_SECRET` - A strong secret key for JWT tokens
   - Other configuration as needed

3. **Build and start containers**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

**Note:** First build may take 5-10 minutes to download base images.

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed Docker documentation.

### Option 2: Local Development

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd Springboot
   ```

2. **Configure MongoDB**
   - Update `src/main/resources/application.properties`
   - Set `spring.data.mongodb.uri` with your MongoDB connection string
   - Or set environment variable `SPRING_DATA_MONGODB_URI`

3. **Build and run**
   ```bash
   # Using Maven wrapper (Windows)
   ./mvnw.cmd spring-boot:run
   
   # Using Maven wrapper (Linux/Mac)
   ./mvnw spring-boot:run
   
   # Or using installed Maven
   mvn spring-boot:run
   ```

   Backend runs on http://localhost:8080 (or port 9000 if not configured)

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd React+vite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API URL**
   - Create `.env` file in `React+vite/` directory
   - Add: `VITE_API_URL=http://localhost:8080` (or your backend URL)

4. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend runs on http://localhost:5173 (Vite default port)

## 🔧 Environment Variables

### Backend (Spring Boot)

Configure via `application.properties` or environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Server port | 8080 |
| `SPRING_DATA_MONGODB_URI` | MongoDB connection string | - |
| `SPRING_DATA_MONGODB_DATABASE` | Database name | job_portal |
| `SECURITY_JWT_SECRET` | JWT signing secret | 
| `APP_CORS_ALLOWED_ORIGINS` | Allowed CORS origins | * |
| `N8N_WEBHOOK_URL` | N8N webhook URL (optional) | - |


### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:9000 |

For Docker, set `VITE_API_URL=""` to use relative URLs (nginx proxy).

## 📚 API Documentation

### Authentication Endpoints
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/change-password` - Change password

### Job Endpoints
- `GET /jobs` - Get all active jobs
- `GET /jobs/{id}` - Get job by ID
- `GET /jobs/search` - Search jobs by keyword
- `POST /jobs` - Create job (Recruiter/Company)
- `PUT /jobs/{id}` - Update job (Recruiter/Company)
- `DELETE /jobs/{id}` - Delete job (Recruiter/Company)
- `GET /jobs/mine` - Get jobs posted by current user

### Application Endpoints
- `GET /applications/me` - Get my applications (Job Seeker)
- `POST /applications` - Apply to a job
- `GET /applications/job/{jobId}` - Get applications for a job (Recruiter)
- `GET /applications/{id}` - Get application by ID
- `DELETE /applications/{id}` - Withdraw application

### Profile Endpoints
- `GET /me` - Get current user profile
- `PUT /me` - Update profile
- `POST /me/resume` - Upload resume
- `GET /me/resume` - Download resume

### Challenge Endpoints
- `GET /challenges` - Get all challenges
- `GET /challenges/{id}` - Get challenge by ID
- `POST /challenges` - Create challenge (Company)
- `POST /challenges/{id}/submit` - Submit challenge solution

### Admin Endpoints
- `GET /admin/dashboard/summary` - Dashboard summary
- `GET /admin/companies` - Get all companies
- `POST /admin/companies` - Create company

## 🔐 User Roles

The application supports three user roles:

- **JOBSEEKER**: Can browse jobs, apply, take tests, upload resumes
- **RECRUITER**: Can post jobs, review applications, manage challenges
- **COMPANY**: Similar to recruiter, can also create challenges

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild specific service
docker-compose build frontend
docker-compose build backend

# Restart service
docker-compose restart backend
```

## 🧪 Testing

### Backend Tests
```bash
cd Springboot
mvn test
```

### Frontend Tests
```bash
cd React+vite
npm run test  # If test framework is configured
```

## 🛠️ Development

### Code Style
- **Backend**: Follow Java conventions and Spring Boot best practices
- **Frontend**: ESLint is configured, run `npm run lint` to check

### Building for Production

#### Frontend
```bash
cd React+vite
npm run build
```
Output: `dist/` directory

#### Backend
```bash
cd Springboot
mvn clean package
```
Output: `target/*.jar` file

## 🐛 Troubleshooting

### Port Already in Use
- Change ports in `docker-compose.yml` or stop conflicting services
- Check ports: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (Linux/Mac)

### MongoDB Connection Issues
- Verify connection string is correct
- Check MongoDB is running (local) or IP is whitelisted (Atlas)
- Test connection with MongoDB Compass or CLI

### Frontend Can't Reach Backend
- Check backend is running
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- For Docker: Verify both services are on same network

### Build Failures
- Clear Docker cache: `docker-compose build --no-cache`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clean Maven: `mvn clean`

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/1?v=4" width="80" style="border-radius:50%"><br>
      <b>Nishanth S</b><br>
      Contributor<br>
      <a href="https://github.com/Nishanth-cyer">GitHub</a>
    </td>
  </tr>

   <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/1?v=4" width="80" style="border-radius:50%"><br>
      <b>Karthikeyan P</b><br>
      Contributor<br>
      <a href="https://github.com/Karthi-Keyan-pnk">GitHub</a>
    </td>
  </tr>

  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/1?v=4" width="80" style="border-radius:50%"><br>
      <b>Muthusanjay M</b><br>
      Contributor<br>
      <a href="https://github.com/MuthuSanjay">GitHub</a>
    </td>
  </tr>
</table>

## Deployment

[![Live](https://img.shields.io/badge/Live-Render-brightgreen)](https://job-search-8eqe.onrender.com)

🔗 https://job-search-8eqe.onrender.com


## 🙏 Acknowledgments

- Spring Boot team
- React team
- Vite team
- MongoDB

---

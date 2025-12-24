# Single Dockerfile for deploying both frontend and backend as one image
# This Dockerfile builds the React frontend and embeds it in the Spring Boot backend
# Spring Boot will serve the static files, so only one service is needed

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY React+vite/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY React+vite/ .

# Build argument for API URL (empty = relative URLs, served from same Spring Boot instance)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build the React app for production
RUN npm run build

# Stage 2: Build Spring Boot Backend
FROM maven:3.9-eclipse-temurin-21 AS backend-builder

WORKDIR /app/backend

# Copy pom.xml first (for layer caching)
COPY Springboot/pom.xml ./

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy backend source code
COPY Springboot/src ./src

# Copy built frontend files to Spring Boot static resources directory
# Spring Boot serves static files from src/main/resources/static
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

# Build the Spring Boot application (skip tests for faster builds)
RUN mvn clean package -DskipTests

# Stage 3: Runtime - Run Spring Boot (serves both frontend and backend)
FROM eclipse-temurin:21-jre-alpine

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Copy the built JAR from backend builder
COPY --from=backend-builder /app/backend/target/*.jar app.jar

# Change ownership to non-root user
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring:spring

# Expose port (Render will set PORT environment variable)
# Default to 8080, but Spring Boot will read SERVER_PORT env var
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVER_PORT:-8080}/ || exit 1

# Run Spring Boot application
# Spring Boot will serve static files from /static and handle API routes
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]

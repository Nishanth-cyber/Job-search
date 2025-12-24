# Stage 1: Build the Spring Boot application with Maven
# Why: We need Maven to compile Java code, download dependencies, and package the JAR
FROM maven:3.9-eclipse-temurin-21 AS builder

# Set working directory inside the container
WORKDIR /app

# Copy pom.xml first (Docker layer caching optimization)
# Why: Dependencies change less frequently than code, so we cache this layer
COPY pom.xml .

# Download dependencies (this layer will be cached unless pom.xml changes)
# Why: Pre-download dependencies to speed up subsequent builds
RUN mvn dependency:go-offline -B

# Copy the rest of the source code
COPY src ./src

# Build the application (skip tests for faster builds in Docker)
# Why: Compile Java code, run tests, and package into an executable JAR
RUN mvn clean package -DskipTests

# Stage 2: Run the Spring Boot application
# Why: We only need Java runtime, not Maven, making the final image much smaller
FROM eclipse-temurin:21-jre-alpine

# Create a non-root user for security
# Why: Running as root is a security risk; use a dedicated user instead
RUN addgroup -S spring && adduser -S spring -G spring

# Set working directory
WORKDIR /app

# Copy the built JAR from builder stage
# Why: Copy only the final artifact, not source code or build tools
COPY --from=builder /app/target/*.jar app.jar

# Change ownership to non-root user
# Why: Ensure the spring user can execute the JAR file
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring:spring

# Expose port 8080
# Why: Spring Boot will listen on port 8080 (configured via environment variable)
EXPOSE 8080

# Health check (optional - uncomment if you have a health endpoint)
# Why: Docker can monitor if the application is healthy
# HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
#   CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the Spring Boot application
# Why: Start the application with JVM optimizations for containers
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]

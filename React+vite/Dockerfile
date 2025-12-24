# Stage 1: Build the React application
# Why: We need Node.js to install dependencies and build the Vite project
FROM node:20-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package files first (Docker layer caching optimization)
# Why: Dependencies change less frequently than code, so we cache this layer
COPY package*.json ./

# Install dependencies
# Why: Install all npm packages needed to build the application (including dev dependencies)
# npm ci installs all dependencies by default, including devDependencies
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Accept API URL as build argument (defaults to relative URL for nginx proxy)
# Why: Frontend runs in browser, so it uses relative URLs and nginx proxies to backend
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

# Build the application for production
# Why: Vite bundles and optimizes the React app for production deployment
RUN npm run build

# Stage 2: Serve the built application with Nginx
# Why: Nginx is lightweight, efficient, and perfect for serving static files
FROM nginx:alpine

# Copy the built files from builder stage to nginx html directory
# Why: Nginx serves static files from /usr/share/nginx/html by default
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
# Why: We need to configure Nginx to handle React Router and proxy API requests
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
# Why: Map container port 80 to host port 3000 as per requirements
EXPOSE 80

# Start Nginx
# Why: Nginx runs in foreground so Docker can track the process
CMD ["nginx", "-g", "daemon off;"]

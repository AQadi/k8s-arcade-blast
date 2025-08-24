# Space Invaders - Docker Build Instructions

## Quick Start

### Build and Run with Docker
```bash
# Build the image
docker build -t space-invaders .

# Run the container
docker run -p 3000:80 space-invaders
```

### Using Docker Compose (Recommended)
```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d --build
```

## Access the Application
- **Local:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

## Production Deployment

### Build for Production
```bash
# Build optimized image
docker build -t space-invaders:latest .

# Tag for registry
docker tag space-invaders:latest your-registry/space-invaders:latest

# Push to registry
docker push your-registry/space-invaders:latest
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: space-invaders
spec:
  replicas: 3
  selector:
    matchLabels:
      app: space-invaders
  template:
    metadata:
      labels:
        app: space-invaders
    spec:
      containers:
      - name: space-invaders
        image: your-registry/space-invaders:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: space-invaders-service
spec:
  selector:
    app: space-invaders
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

## Features
- Multi-stage build for optimized image size
- Nginx for production serving
- Gzip compression enabled
- Security headers configured
- Health check endpoint
- React Router support (SPA)
- Static asset caching
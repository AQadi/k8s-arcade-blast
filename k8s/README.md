# Kubernetes Deployment for Play with K8s

## Prerequisites
1. Build the Docker image first:
```bash
docker build -t space-invaders:latest .
```

## Deploy to Play with Kubernetes

### Step 1: Apply the deployment
```bash
kubectl apply -f k8s/deployment.yaml
```

### Step 2: Apply the service
```bash
kubectl apply -f k8s/service.yaml
```

### Step 3: Check deployment status
```bash
kubectl get pods
kubectl get services
```

### Step 4: Access the application
For Play with K8s, the app will be available on:
- NodePort: `http://<node-ip>:30080`
- LoadBalancer: Check external IP with `kubectl get svc space-invaders-loadbalancer`

## Quick Deploy (All at once)
```bash
kubectl apply -f k8s/
```

## Clean up
```bash
kubectl delete -f k8s/
```

## Troubleshooting
```bash
# Check pod logs
kubectl logs -l app=space-invaders

# Describe pods for issues
kubectl describe pods -l app=space-invaders

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
```
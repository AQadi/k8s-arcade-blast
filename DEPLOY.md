# Complete Deployment Commands for Play with Kubernetes

## Fresh Instance Setup Commands

Copy and paste these commands in sequence:

```bash
# Step 1: Clone or upload your project files to the instance
# (Assuming files are already present)

# Step 2: Build the Docker image
docker build -t space-invaders:latest .

# Step 3: Verify the image was built
docker images | grep space-invaders

# Step 4: Create the Kubernetes resources
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Step 5: Wait for pods to be ready (may take 1-2 minutes)
kubectl wait --for=condition=ready pod -l app=space-invaders --timeout=300s

# Step 6: Check deployment status
kubectl get pods -l app=space-invaders
kubectl get services

# Step 7: Get the NodePort access URL
echo "Access the app at: http://$(hostname -I | awk '{print $1}'):30080"

# Step 8: Check if LoadBalancer got external IP (optional)
kubectl get svc space-invaders-loadbalancer

# Step 9: Test the health endpoint
curl -f http://localhost:30080/health || echo "Health check failed"
```

## One-liner for quick deployment:
```bash
docker build -t space-invaders:latest . && kubectl apply -f k8s/ && kubectl wait --for=condition=ready pod -l app=space-invaders --timeout=300s && echo "App available at: http://$(hostname -I | awk '{print $1}'):30080"
```

## Verification Commands:
```bash
# Check pod logs if there are issues
kubectl logs -l app=space-invaders

# Check detailed pod status
kubectl describe pods -l app=space-invaders

# Check all events
kubectl get events --sort-by=.metadata.creationTimestamp
```

## Cleanup (when done):
```bash
kubectl delete -f k8s/
```

## Expected Output:
- Pods should show "Running" status
- Service should show NodePort 30080
- App accessible at `http://<node-ip>:30080`
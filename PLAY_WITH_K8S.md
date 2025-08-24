# Complete Setup Guide for Play with Kubernetes

## Fresh Instance Deployment Commands

### Step 1: Get the code onto the instance
Choose one of these methods:

**Option A: Clone from repository (if available)**
```bash
git clone <your-repo-url>
cd <project-directory>
```

**Option B: Upload files manually**
```bash
# Create project directory
mkdir space-invaders-k8s
cd space-invaders-k8s

# Use the file upload feature in Play with K8s interface
# Or copy files using the editor
```

### Step 2: Complete deployment sequence
```bash
# Build the Docker image
docker build -t space-invaders:latest .

# Verify image was built successfully
docker images | grep space-invaders

# Apply Kubernetes manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Wait for deployment to be ready (up to 5 minutes)
kubectl wait --for=condition=ready pod -l app=space-invaders --timeout=300s

# Check deployment status
kubectl get pods -l app=space-invaders -o wide
kubectl get services -o wide

# Get the node IP and access URL
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "🚀 Access your Space Invaders game at: http://$NODE_IP:30080"

# Test the health endpoint
curl -f http://$NODE_IP:30080/health && echo "✅ Health check passed!"
```

### Step 3: Verification commands
```bash
# Check if everything is running correctly
kubectl get all -l app=space-invaders

# View pod logs if needed
kubectl logs -l app=space-invaders --tail=50

# Check resource usage
kubectl top pods -l app=space-invaders
```

## 🔥 One-Liner for Quick Deployment
```bash
docker build -t space-invaders:latest . && kubectl apply -f k8s/ && kubectl wait --for=condition=ready pod -l app=space-invaders --timeout=300s && NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}') && echo "🚀 Space Invaders ready at: http://$NODE_IP:30080"
```

## 🧹 Cleanup (when finished)
```bash
kubectl delete -f k8s/
docker rmi space-invaders:latest
```

## 🔧 Troubleshooting Commands
```bash
# If pods are not starting
kubectl describe pods -l app=space-invaders

# Check cluster events
kubectl get events --sort-by=.metadata.creationTimestamp --field-selector type=Warning

# Check node resources
kubectl describe nodes

# Force restart deployment
kubectl rollout restart deployment/space-invaders
```

## Expected Results:
- ✅ Docker image builds successfully (~30-60 seconds)
- ✅ Pods reach "Running" status (~1-2 minutes)  
- ✅ Service exposes NodePort 30080
- ✅ Game accessible in browser via node IP
- ✅ Health endpoint returns "healthy"

## Access Information:
- **Game URL**: `http://<node-ip>:30080`
- **Health Check**: `http://<node-ip>:30080/health`
- **Port**: 30080 (NodePort)

The entire process should take 2-5 minutes on a fresh Play with K8s instance.
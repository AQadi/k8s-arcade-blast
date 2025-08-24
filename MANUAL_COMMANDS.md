# Manual Commands for Play with Kubernetes

## Step-by-Step Commands (Copy & Paste Each)

### 1. Build Docker Image
```bash
docker build -t space-invaders:latest .
```

### 2. Verify Image Built
```bash
docker images | grep space-invaders
```

### 3. Deploy to Kubernetes
```bash
kubectl apply -f k8s/deployment.yaml
```

### 4. Create Service
```bash
kubectl apply -f k8s/service.yaml
```

### 5. Wait for Pods to be Ready
```bash
kubectl wait --for=condition=ready pod -l app=space-invaders --timeout=300s
```

### 6. Check Status
```bash
kubectl get pods -l app=space-invaders
kubectl get services
```

### 7. Get Access URL
```bash
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "Access your game at: http://$NODE_IP:30080"
```

### 8. Test Health Check
```bash
curl -f http://localhost:30080/health
```

## All-in-One Command
```bash
docker build -t space-invaders:latest . && kubectl apply -f k8s/ && kubectl wait --for=condition=ready pod -l app=space-invaders --timeout=300s && NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}') && echo "🚀 Game ready at: http://$NODE_IP:30080"
```

## Clean Up When Done
```bash
kubectl delete -f k8s/
```
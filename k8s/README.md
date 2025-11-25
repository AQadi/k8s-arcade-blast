# K3s Deployment for Space Invaders

## Prerequisites
1. K3s installed on your system
2. Build the Docker image first:
```bash
docker build -t space-invaders:latest .
```

3. Import the image to k3s:
```bash
# For k3s, import the image directly
sudo k3s ctr images import space-invaders.tar

# Or save and load:
docker save space-invaders:latest -o space-invaders.tar
sudo k3s ctr images import space-invaders.tar
```

## Deploy to K3s

### Quick Deploy (All at once)
```bash
kubectl apply -f k8s/
```

### Step-by-Step Deploy

1. Apply the deployment:
```bash
kubectl apply -f k8s/deployment.yaml
```

2. Apply the service:
```bash
kubectl apply -f k8s/service.yaml
```

3. Check deployment status:
```bash
kubectl get pods
kubectl get services
```

## Access the Application

### NodePort Access
The app will be available on:
- HTTP: `http://<node-ip>:30080`
- WebSocket: `ws://<node-ip>:30999`

Get your node IP:
```bash
kubectl get nodes -o wide
```

### LoadBalancer Access (if configured)
Check external IP:
```bash
kubectl get svc space-invaders-loadbalancer
```

## Scaling

Scale replicas up or down:
```bash
kubectl scale deployment space-invaders --replicas=3
```

## Monitoring

View logs:
```bash
kubectl logs -l app=space-invaders -f
```

Check pod status:
```bash
kubectl describe pods -l app=space-invaders
```

## Clean up
```bash
kubectl delete -f k8s/
```

## Troubleshooting

### Pods not starting
```bash
kubectl describe pods -l app=space-invaders
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Image pull issues
Make sure the image is imported into k3s:
```bash
sudo k3s ctr images ls | grep space-invaders
```

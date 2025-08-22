import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GameState } from './SpaceInvaders';
import { useEffect, useState } from 'react';

interface ContainerMetrics {
  id: string;
  cpuUsage: number;
  memoryUsage: number;
  networkIO: number;
  responseTime: number;
  requestCount: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface MetricsDashboardProps {
  gameState: GameState;
}

export const MetricsDashboard = ({ gameState }: MetricsDashboardProps) => {
  const [containers, setContainers] = useState<ContainerMetrics[]>([]);
  const [totalThroughput, setTotalThroughput] = useState(0);
  const [loadBalancerHealth, setLoadBalancerHealth] = useState(100);

  const containerCount = gameState.currentMission?.containerCount || 1;

  useEffect(() => {
    const interval = setInterval(() => {
      const baseLoad = gameState.enemies.length * 10 + gameState.bullets.length * 5;
      const gameIntensity = Math.min(100, baseLoad);
      
      const newContainers: ContainerMetrics[] = [];
      let totalRequests = 0;

      for (let i = 0; i < containerCount; i++) {
        // Simulate realistic container metrics based on game state
        const containerLoad = baseLoad / containerCount + Math.random() * 20 - 10;
        const cpuUsage = Math.max(10, Math.min(95, 30 + containerLoad + Math.random() * 15));
        const memoryUsage = Math.max(20, Math.min(90, 40 + containerLoad * 0.8 + Math.random() * 10));
        const networkIO = Math.max(5, gameIntensity * 2 + Math.random() * 30);
        const responseTime = Math.max(50, 100 - (containerCount * 10) + Math.random() * 50);
        const requestCount = Math.floor(50 + gameIntensity * 3 + Math.random() * 100);
        
        totalRequests += requestCount;

        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (cpuUsage > 80 || memoryUsage > 85) status = 'critical';
        else if (cpuUsage > 60 || memoryUsage > 70) status = 'warning';

        newContainers.push({
          id: `pod-${i + 1}`,
          cpuUsage,
          memoryUsage,
          networkIO,
          responseTime,
          requestCount,
          status
        });
      }

      setContainers(newContainers);
      setTotalThroughput(totalRequests);
      
      // Load balancer health based on container distribution
      const avgCpu = newContainers.reduce((sum, c) => sum + c.cpuUsage, 0) / containerCount;
      setLoadBalancerHealth(Math.max(60, 100 - avgCpu * 0.5));
      
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.enemies.length, gameState.bullets.length, containerCount]);

  return (
    <div className="fixed top-4 right-4 w-80 space-y-2 text-xs">
      {/* Cluster Overview */}
      <Card className="p-3 cyber-border bg-card/90 backdrop-blur-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-primary font-semibold">K8s Cluster Status</span>
            <Badge variant={loadBalancerHealth > 80 ? 'default' : loadBalancerHealth > 60 ? 'secondary' : 'destructive'}>
              {loadBalancerHealth > 80 ? 'Optimal' : loadBalancerHealth > 60 ? 'Degraded' : 'Critical'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Pods:</span>
              <span className="text-primary ml-1">{containerCount}/3</span>
            </div>
            <div>
              <span className="text-muted-foreground">Throughput:</span>
              <span className="text-primary ml-1">{totalThroughput}/s</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Container Metrics */}
      {containers.map((container, index) => (
        <Card key={container.id} className="p-3 cyber-border bg-card/90 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-primary font-semibold">{container.id}</span>
              <Badge variant={
                container.status === 'healthy' ? 'default' :
                container.status === 'warning' ? 'secondary' : 'destructive'
              }>
                {container.status}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">CPU</span>
                <span className="text-xs">{container.cpuUsage.toFixed(1)}%</span>
              </div>
              <Progress value={container.cpuUsage} className="h-1" />
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Memory</span>
                <span className="text-xs">{container.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={container.memoryUsage} className="h-1" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Network:</span>
                <span className="text-primary ml-1">{container.networkIO.toFixed(0)} MB/s</span>
              </div>
              <div>
                <span className="text-muted-foreground">Response:</span>
                <span className="text-primary ml-1">{container.responseTime.toFixed(0)}ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Requests:</span>
                <span className="text-primary ml-1">{container.requestCount}/s</span>
              </div>
              <div>
                <span className="text-muted-foreground">Replicas:</span>
                <span className="text-primary ml-1">{containerCount > 1 ? `1/${containerCount}` : '1/1'}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Load Balancer Info (only for multi-container) */}
      {containerCount > 1 && (
        <Card className="p-3 cyber-border bg-card/90 backdrop-blur-sm">
          <div className="space-y-2">
            <span className="text-primary font-semibold">Load Balancer</span>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>
                <span className="text-muted-foreground">Algorithm:</span>
                <span className="text-primary ml-1">Round Robin</span>
              </div>
              <div>
                <span className="text-muted-foreground">Health:</span>
                <span className="text-primary ml-1">{loadBalancerHealth.toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sessions:</span>
                <span className="text-primary ml-1">{Math.floor(totalThroughput / 10)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Failover:</span>
                <span className="text-success ml-1">Ready</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
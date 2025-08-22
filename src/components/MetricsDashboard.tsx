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

      // Always show 3 containers for consistent metrics display
      for (let i = 0; i < 3; i++) {
        let cpuUsage, memoryUsage, networkIO, responseTime, requestCount;
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';

        if (i < containerCount) {
          // Active container - real metrics based on game state
          const containerLoad = baseLoad / containerCount + Math.random() * 20 - 10;
          cpuUsage = Math.max(10, Math.min(95, 30 + containerLoad + Math.random() * 15));
          memoryUsage = Math.max(20, Math.min(90, 40 + containerLoad * 0.8 + Math.random() * 10));
          networkIO = Math.max(5, gameIntensity * 2 + Math.random() * 30);
          responseTime = Math.max(50, 100 - (containerCount * 10) + Math.random() * 50);
          requestCount = Math.floor(50 + gameIntensity * 3 + Math.random() * 100);

          if (cpuUsage > 80 || memoryUsage > 85) status = 'critical';
          else if (cpuUsage > 60 || memoryUsage > 70) status = 'warning';
        } else {
          // Inactive container - minimal/idle metrics
          cpuUsage = Math.random() * 5 + 2; // 2-7%
          memoryUsage = Math.random() * 10 + 15; // 15-25%
          networkIO = Math.random() * 2; // 0-2 MB/s
          responseTime = 0;
          requestCount = 0;
          status = 'healthy';
        }
        
        totalRequests += requestCount;

        newContainers.push({
          id: `pod-${i + 1}`,
          cpuUsage,
          memoryUsage,
          networkIO,
          responseTime,
          requestCount,
          status: i < containerCount ? status : 'healthy'
        });
      }

      setContainers(newContainers);
      setTotalThroughput(totalRequests);
      
      // Load balancer health based on active container distribution
      const activeCpuAvg = newContainers.slice(0, containerCount).reduce((sum, c) => sum + c.cpuUsage, 0) / containerCount;
      setLoadBalancerHealth(Math.max(60, 100 - activeCpuAvg * 0.5));
      
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.enemies.length, gameState.bullets.length, containerCount]);

  return (
    <div className="w-full h-full overflow-y-auto space-y-3 text-xs">
      {/* Active Pods View */}
      <Card className="p-3 cyber-border bg-card/90 backdrop-blur-sm">
        <div className="space-y-3">
          <span className="text-primary font-semibold">Active Pods</span>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((podNum) => {
              const isActive = podNum <= containerCount;
              const container = containers.find(c => c.id === `pod-${podNum}`);
              return (
                <div key={podNum} className="flex flex-col items-center space-y-1">
                  <div className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-all ${
                    isActive 
                      ? container?.status === 'critical' 
                        ? 'border-destructive bg-destructive/20 text-destructive' 
                        : container?.status === 'warning'
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500'
                        : 'border-primary bg-primary/20 text-primary'
                      : 'border-muted bg-muted/20 text-muted-foreground'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''} ${
                      isActive 
                        ? container?.status === 'critical' 
                          ? 'bg-destructive' 
                          : container?.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-primary'
                        : 'bg-muted-foreground'
                    }`} />
                  </div>
                  <span className={`text-xs ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    Pod-{podNum}
                  </span>
                  <span className={`text-xs ${isActive ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {isActive ? 'Active' : 'Standby'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

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
              <span className="text-muted-foreground">Active Pods:</span>
              <span className="text-primary ml-1">{containerCount}/3</span>
            </div>
            <div>
              <span className="text-muted-foreground">Throughput:</span>
              <span className="text-primary ml-1">{totalThroughput}/s</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Container Metrics - Always show all 3 pods */}
      {containers.map((container, index) => {
        const isActive = index < containerCount;
        return (
          <Card key={container.id} className={`p-3 cyber-border bg-card/90 backdrop-blur-sm ${!isActive ? 'opacity-50' : ''}`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-primary font-semibold">{container.id}</span>
                  {!isActive && <Badge variant="outline" className="text-xs">Standby</Badge>}
                </div>
                <Badge variant={
                  !isActive ? 'outline' :
                  container.status === 'healthy' ? 'default' :
                  container.status === 'warning' ? 'secondary' : 'destructive'
                }>
                  {!isActive ? 'idle' : container.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
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
                  <span className="text-primary ml-1">{container.networkIO.toFixed(1)} MB/s</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Response:</span>
                  <span className="text-primary ml-1">{isActive ? `${container.responseTime.toFixed(0)}ms` : '0ms'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Requests:</span>
                  <span className="text-primary ml-1">{container.requestCount}/s</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-primary ml-1">{isActive ? 'Active' : 'Idle'}</span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Load Balancer Info */}
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
              <span className="text-muted-foreground">Mode:</span>
              <span className="text-primary ml-1">{containerCount > 1 ? 'Distributed' : 'Single Node'}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
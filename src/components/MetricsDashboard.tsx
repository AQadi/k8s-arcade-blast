import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GameState } from './SpaceInvaders';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Activity, Cpu, Database } from 'lucide-react';
import { GameTestSuite } from '@/utils/testUtils';

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
  const [expandedPods, setExpandedPods] = useState<Set<string>>(new Set());
  const [clusterHealth, setClusterHealth] = useState(100);
  const [totalLoad, setTotalLoad] = useState(0);

  const containerCount = gameState.currentMission?.containerCount || 1;

  useEffect(() => {
    const interval = setInterval(() => {
      const baseLoad = gameState.enemies.length * 10 + gameState.bullets.length * 5;
      const gameIntensity = Math.min(100, baseLoad);
      
      const newContainers: ContainerMetrics[] = [];
      let totalRequests = 0;
      let avgCpu = 0;

      for (let i = 0; i < 3; i++) {
        let cpuUsage, memoryUsage, networkIO, responseTime, requestCount;
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';

        if (i < containerCount) {
          // Reduce fluctuation when game is paused
          const fluctuation = gameState.gameStatus === 'playing' ? Math.random() * 15 : Math.random() * 3;
          const containerLoad = baseLoad / containerCount + (gameState.gameStatus === 'playing' ? Math.random() * 20 - 10 : 0);
          cpuUsage = Math.max(10, Math.min(95, 30 + containerLoad + fluctuation));
          memoryUsage = Math.max(20, Math.min(90, 40 + containerLoad * 0.8 + fluctuation * 0.7));
          networkIO = Math.max(5, (gameState.gameStatus === 'playing' ? gameIntensity * 2 : 10) + Math.random() * 30);
          responseTime = Math.max(50, 100 - (containerCount * 10) + Math.random() * 50);
          requestCount = Math.floor(50 + gameIntensity * 3 + Math.random() * 100);

          if (cpuUsage > 80 || memoryUsage > 85) status = 'critical';
          else if (cpuUsage > 60 || memoryUsage > 70) status = 'warning';
          
          avgCpu += cpuUsage;
        } else {
          cpuUsage = Math.random() * 5 + 2;
          memoryUsage = Math.random() * 10 + 15;
          networkIO = Math.random() * 2;
          responseTime = 0;
          requestCount = 0;
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
      setTotalLoad(gameIntensity);
      setClusterHealth(Math.max(60, 100 - (avgCpu / containerCount) * 0.5));

      // Run automated tests every 5 seconds during gameplay
      if (Date.now() % 5000 < 1000 && gameState.gameStatus === 'playing') {
        GameTestSuite.runFullTestSuite(gameState, {}, newContainers);
      }
      
    }, gameState.gameStatus === 'playing' ? 1000 : 5000); // Slower updates when paused

    return () => clearInterval(interval);
  }, [gameState.enemies.length, gameState.bullets.length, containerCount]);

  const togglePodExpansion = (podId: string) => {
    setExpandedPods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(podId)) {
        newSet.delete(podId);
      } else {
        newSet.add(podId);
      }
      return newSet;
    });
  };

  const criticalPods = containers.filter(c => c.status === 'critical').length;
  const warningPods = containers.filter(c => c.status === 'warning').length;
  const activePods = containers.slice(0, containerCount);
  const avgCpu = activePods.reduce((sum, c) => sum + c.cpuUsage, 0) / containerCount;
  const avgMemory = activePods.reduce((sum, c) => sum + c.memoryUsage, 0) / containerCount;

  return (
    <div className="w-full max-w-[240px] h-full overflow-y-auto space-y-3 text-xs">
      {/* CRITICAL ALERTS - Top Priority */}
      {(criticalPods > 0 || warningPods > 0) && (
        <Card className="p-3 border-destructive bg-destructive/10 animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <div>
              <div className="text-destructive font-semibold">ALERTS</div>
              <div className="text-xs">
                {criticalPods > 0 && <span className="text-destructive">{criticalPods} Critical</span>}
                {warningPods > 0 && <span className="text-yellow-500 ml-2">{warningPods} Warning</span>}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* PRIMARY METRICS - Always Visible */}
      <Card className="p-3 cyber-border bg-card/90 backdrop-blur-sm">
        <div className="space-y-3">
          {/* Cluster Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">Cluster</span>
            </div>
            <Badge variant={clusterHealth > 80 ? 'default' : clusterHealth > 60 ? 'secondary' : 'destructive'}>
              {clusterHealth.toFixed(0)}%
            </Badge>
          </div>

          {/* Active Pods Visual */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Active Pods ({containerCount}/3)</div>
            <div className="flex space-x-1">
              {[1, 2, 3].map((podNum) => {
                const isActive = podNum <= containerCount;
                const container = containers.find(c => c.id === `pod-${podNum}`);
                return (
                  <div
                    key={podNum}
                    className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                      isActive 
                        ? container?.status === 'critical' 
                          ? 'border-destructive bg-destructive/20' 
                          : container?.status === 'warning'
                          ? 'border-yellow-500 bg-yellow-500/20'
                          : 'border-primary bg-primary/20'
                        : 'border-muted bg-muted/10'
                    }`}
                    onClick={() => isActive && togglePodExpansion(container?.id || '')}
                  >
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
                );
              })}
            </div>
          </div>

          {/* Current Load */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Load</span>
              <span className="font-mono">{totalLoad.toFixed(0)}%</span>
            </div>
            <Progress value={totalLoad} className="h-2" />
          </div>
        </div>
      </Card>

      {/* SECONDARY METRICS - Condensed Overview */}
      <Card className="p-3 cyber-border bg-card/90 backdrop-blur-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary">Resources</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">CPU Avg</div>
              <div className="font-mono text-primary">{avgCpu.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">RAM Avg</div>
              <div className="font-mono text-primary">{avgMemory.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Requests/s</div>
              <div className="font-mono text-primary">{activePods.reduce((sum, c) => sum + c.requestCount, 0)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Latency</div>
              <div className="font-mono text-primary">{(activePods.reduce((sum, c) => sum + c.responseTime, 0) / containerCount).toFixed(0)}ms</div>
            </div>
          </div>
        </div>
      </Card>

      {/* DETAILED POD METRICS - Progressive Disclosure */}
      {Array.from(expandedPods).map(podId => {
        const container = containers.find(c => c.id === podId);
        if (!container) return null;

        return (
          <Card key={`expanded-${podId}`} className="p-3 border-primary/50 bg-card/95 backdrop-blur-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-primary">{container.id}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePodExpansion(podId)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs">
                    <span>CPU</span>
                    <span>{container.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={container.cpuUsage} className="h-1.5" />
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span>Memory</span>
                    <span>{container.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={container.memoryUsage} className="h-1.5" />
                </div>

                <div className="grid grid-cols-2 gap-1 text-xs pt-1 border-t">
                  <div>
                    <span className="text-muted-foreground">I/O:</span>
                    <span className="ml-1 font-mono">{container.networkIO.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RT:</span>
                    <span className="ml-1 font-mono">{container.responseTime.toFixed(0)}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
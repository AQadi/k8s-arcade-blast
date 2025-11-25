import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server, Zap } from 'lucide-react';

interface MetricsDashboardProps {
  intensity: number;
  containerMode: 'single' | 'triple';
}

export const MetricsDashboard = ({ intensity, containerMode }: MetricsDashboardProps) => {
  const cpuUsage = Math.min(95, 20 + (intensity * 20));
  const memoryUsage = Math.min(90, 30 + (intensity * 15));
  const networkUsage = Math.min(85, 15 + (intensity * 18));
  const responseTime = Math.max(10, 200 - (intensity * 30));
  
  const containerCount = containerMode === 'triple' ? 3 : 1;

  return (
    <div className="w-[240px] h-full overflow-y-auto space-y-3 p-4">
      {/* Cluster Status */}
      <Card className="p-3 cyber-border bg-card/90 backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary text-sm">Cluster</span>
            </div>
            <Badge variant="default" className="text-xs">
              Active
            </Badge>
          </div>

          {/* Active Pods */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Pods ({containerCount}/3)</div>
            <div className="flex space-x-1">
              {[1, 2, 3].map((podNum) => {
                const isActive = podNum <= containerCount;
                return (
                  <div
                    key={podNum}
                    className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/20'
                        : 'border-muted bg-muted/10'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse bg-primary' : 'bg-muted-foreground'}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Resource Metrics */}
      <Card className="p-3 cyber-border bg-card/90 backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary text-sm">Resources</span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">CPU</span>
              <span className="font-mono font-bold text-primary">{cpuUsage.toFixed(0)}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Memory</span>
              <span className="font-mono font-bold text-primary">{memoryUsage.toFixed(0)}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Network I/O</span>
              <span className="font-mono font-bold text-primary">{networkUsage.toFixed(0)}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Response</span>
              <span className="font-mono font-bold text-primary">{responseTime.toFixed(0)}ms</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Load Indicator */}
      <Card className="p-3 cyber-border bg-card/90 backdrop-blur-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-yellow-500 text-sm">Load</span>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold neon-text tabular-nums">
              {(intensity * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Server Intensity</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server, Zap } from 'lucide-react';
interface MetricsDashboardProps {
  intensity: number;
  containerMode: 'single' | 'triple';
}
export const MetricsDashboard = ({
  intensity,
  containerMode
}: MetricsDashboardProps) => {
  const cpuUsage = Math.min(95, 20 + intensity * 20);
  const memoryUsage = Math.min(90, 30 + intensity * 15);
  const networkUsage = Math.min(85, 15 + intensity * 18);
  const responseTime = Math.max(10, 200 - intensity * 30);
  const containerCount = containerMode === 'triple' ? 3 : 1;
  return <div className="w-[240px] h-full overflow-y-auto space-y-3 p-4">
      {/* Cluster Status */}
      

      {/* Resource Metrics */}
      

      {/* Load Indicator */}
      
    </div>;
};
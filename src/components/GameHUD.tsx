import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart } from 'lucide-react';

interface GameHUDProps {
  score: number;
  wave: number;
  health: number;
}

export const GameHUD = ({
  score,
  wave,
  health
}: GameHUDProps) => {
  const healthPercentage = Math.max(0, Math.min(100, health));
  
  // Determine health bar color based on percentage
  const getHealthColor = () => {
    if (healthPercentage > 60) return 'bg-green-500';
    if (healthPercentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="cyber-border bg-background/95 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Left Section - Wave */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Badge variant="outline" className="neon-text cyber-border text-xs sm:text-sm">
            WAVE {wave}
          </Badge>
        </div>

        {/* Center Section - Health Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xs mx-4">
          <Heart 
            className={`w-5 h-5 sm:w-6 sm:h-6 ${healthPercentage <= 30 ? 'text-red-500 animate-pulse' : 'text-primary'}`} 
          />
          <div className="flex-1 relative">
            <div className="h-4 sm:h-5 bg-muted/50 rounded-full overflow-hidden cyber-border">
              <div 
                className={`h-full ${getHealthColor()} transition-all duration-300 ease-out`}
                style={{ width: `${healthPercentage}%` }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                {healthPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Score */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">SCORE</div>
            <div className="text-lg sm:text-2xl font-bold neon-text tabular-nums">{score.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
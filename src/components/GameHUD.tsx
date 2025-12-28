import { Badge } from '@/components/ui/badge';
import { Heart, Shield } from 'lucide-react';

interface GameHUDProps {
  score: number;
  wave: number;
  health: number;
  shieldActive?: boolean;
  shieldTimeRemaining?: number; // in seconds
}

export const GameHUD = ({
  score,
  wave,
  health,
  shieldActive = false,
  shieldTimeRemaining = 0
}: GameHUDProps) => {
  const healthPercentage = Math.max(0, Math.min(100, health));
  const shieldPercentage = Math.max(0, Math.min(100, (shieldTimeRemaining / 10) * 100)); // 10 seconds max
  
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

        {/* Center Section - Health & Shield Bars */}
        <div className="flex flex-col gap-1 flex-1 max-w-xs mx-4">
          {/* Health Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Heart 
              className={`w-4 h-4 sm:w-5 sm:h-5 ${healthPercentage <= 30 ? 'text-red-500 animate-pulse' : 'text-primary'}`} 
            />
            <div className="flex-1 relative">
              <div className="h-3 sm:h-4 bg-muted/50 rounded-full overflow-hidden cyber-border">
                <div 
                  className={`h-full ${getHealthColor()} transition-all duration-300 ease-out`}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  {healthPercentage}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Shield Bar - only show when active */}
          {shieldActive && (
            <div className="flex items-center gap-2 sm:gap-3 animate-fade-in">
              <Shield 
                className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-pulse" 
              />
              <div className="flex-1 relative">
                <div className="h-3 sm:h-4 bg-muted/50 rounded-full overflow-hidden cyber-border">
                  <div 
                    className="h-full transition-all duration-100 ease-linear"
                    style={{ 
                      width: `${shieldPercentage}%`,
                      background: 'linear-gradient(90deg, #0099ff, #00d4ff, #00ffff)',
                      boxShadow: 'inset 0 0 10px rgba(0, 212, 255, 0.5)',
                    }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {shieldTimeRemaining.toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>
          )}
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
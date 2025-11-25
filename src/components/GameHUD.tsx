import { Badge } from '@/components/ui/badge';
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
  const healthPercentage = health / 100 * 100;
  return <div className="cyber-border bg-background/95 backdrop-blur-sm p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Left Section - Wave */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Badge variant="outline" className="neon-text cyber-border text-xs sm:text-sm">
            WAVE {wave}
          </Badge>
        </div>

        {/* Center Section - Health */}
        

        {/* Right Section - Score */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">SCORE</div>
            <div className="text-lg sm:text-2xl font-bold neon-text tabular-nums">{score.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>;
};
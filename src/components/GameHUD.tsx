import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameState } from './SpaceInvaders';

interface GameHUDProps {
  gameState: GameState;
  onPause: () => void;
}

export const GameHUD = ({ gameState, onPause }: GameHUDProps) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mb-4">
      <Card className="p-4 cyber-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">SCORE</p>
              <p className="text-2xl font-bold neon-text">{gameState.score.toLocaleString()}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">LEVEL</p>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {gameState.level}
              </Badge>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">TIME</p>
              <p className="text-xl font-mono neon-text">
                {formatTime(gameState.timeRemaining)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">HULL INTEGRITY</p>
              <div className="w-48">
                <Progress 
                  value={(gameState.player.health / gameState.player.maxHealth) * 100} 
                  className="h-3 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {gameState.player.health}/{gameState.player.maxHealth}
                </p>
              </div>
            </div>
            
            <Button onClick={onPause} variant="outline" className="cyber-border">
              PAUSE
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
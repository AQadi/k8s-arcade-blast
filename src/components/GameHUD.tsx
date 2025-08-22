import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GameState } from './SpaceInvaders';

interface GameHUDProps {
  gameState: GameState;
  onPause: () => void;
  onEndGame: () => void;
}

export const GameHUD = ({ gameState, onPause, onEndGame }: GameHUDProps) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mb-4 px-2 sm:px-0">
      <Card className="p-2 sm:p-4 cyber-border bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-center space-x-4 sm:space-x-6">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">SCORE</p>
              <p className="text-lg sm:text-2xl font-bold neon-text">{gameState.score.toLocaleString()}</p>
            </div>
            
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">LEVEL</p>
              <Badge variant="secondary" className="text-sm sm:text-lg px-2 sm:px-3 py-1">
                {gameState.level}
              </Badge>
            </div>
            
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">TIME</p>
              <p className="text-lg sm:text-xl font-mono neon-text">
                {formatTime(gameState.timeRemaining)}
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:space-x-4">
            <div className="flex-1 text-center lg:text-right">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">HULL INTEGRITY</p>
              <div className="w-full max-w-xs mx-auto lg:max-w-48 lg:ml-auto space-y-1">
                <Progress 
                  value={(gameState.player.health / gameState.player.maxHealth) * 100} 
                  className="h-2 sm:h-3 bg-muted"
                />
                {gameState.currentMission?.containerCount === 3 && (
                  <Progress 
                    value={(gameState.player.shield / gameState.player.maxShield) * 100} 
                    className="h-1 sm:h-2 bg-muted"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  HP: {gameState.player.health}/{gameState.player.maxHealth}
                  {gameState.currentMission?.containerCount === 3 && (
                    <span className="block sm:inline sm:ml-2">Shield: {gameState.player.shield}/{gameState.player.maxShield}</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex justify-center space-x-2">
              <Button onClick={onPause} variant="outline" className="cyber-border text-xs sm:text-sm px-3 sm:px-4">
                PAUSE
              </Button>
              <Button onClick={onEndGame} variant="destructive" className="cyber-border text-xs sm:text-sm px-3 sm:px-4">
                END MISSION
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
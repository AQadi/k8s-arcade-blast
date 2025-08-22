import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mission } from '@/types/Mission';

interface GameOverScreenProps {
  score: number;
  level: number;
  mission?: Mission;
  onRestart: () => void;
  onNewMission: () => void;
  onMenu: () => void;
}

export const GameOverScreen = ({ score, level, mission, onRestart, onNewMission, onMenu }: GameOverScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 cyber-border neon-glow animate-slide-in-up">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold neon-text bg-gradient-to-r from-destructive to-warning bg-clip-text text-transparent">
            MISSION COMPLETE
          </h1>
          
          {mission && (
            <div className="mb-4">
              <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-lg px-4 py-2">
                {mission.name} - {mission.containerCount} Container{mission.containerCount > 1 ? 's' : ''}
              </Badge>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">FINAL SCORE</p>
                <p className="text-3xl font-bold neon-text">{score.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">LEVEL REACHED</p>
                <Badge variant="secondary" className="text-2xl px-4 py-2">
                  {level}
                </Badge>
              </div>
            </div>
            
            <div className="pt-4">
              <p className="text-lg text-muted-foreground mb-2">Performance Rating</p>
              {score >= 5000 ? (
                <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-success to-accent">
                  LEGENDARY PILOT
                </Badge>
              ) : score >= 2000 ? (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  SKILLED COMMANDER
                </Badge>
              ) : (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  ROOKIE PILOT
                </Badge>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button onClick={onRestart} className="game-button flex-1">
              RETRY MISSION
            </Button>
            <Button onClick={onNewMission} variant="secondary" className="flex-1">
              NEW MISSION
            </Button>
            <Button onClick={onMenu} variant="outline" className="cyber-border flex-1">
              MAIN MENU
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pt-2">
            <p>✅ Kubernetes deployment scaling demonstrated</p>
            <p>📊 Container orchestration performance measured</p>
            {mission && (
              <p>🚀 {mission.containerCount}-container architecture tested successfully</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
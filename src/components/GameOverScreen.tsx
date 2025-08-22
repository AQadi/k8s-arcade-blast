import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GameOverScreenProps {
  score: number;
  level: number;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverScreen = ({ score, level, onRestart, onMenu }: GameOverScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 cyber-border neon-glow animate-slide-in-up">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold neon-text bg-gradient-to-r from-destructive to-warning bg-clip-text text-transparent">
            MISSION COMPLETE
          </h1>
          
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

          <div className="flex space-x-4 pt-4">
            <Button onClick={onRestart} className="game-button flex-1">
              RETRY MISSION
            </Button>
            <Button onClick={onMenu} variant="outline" className="cyber-border flex-1">
              MAIN MENU
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Ready for Kubernetes deployment scaling</p>
            <p>Container orchestration demo complete</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
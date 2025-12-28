import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, RotateCcw } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

export const GameOverScreen = ({ score, onRestart }: GameOverScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-6 sm:p-8 cyber-border neon-glow max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-primary animate-bounce" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-ping" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold neon-text">GAME OVER</h2>
          </div>
          
          <div className="space-y-4 py-4 border-y cyber-border">
            <div className="flex flex-col items-center gap-2 text-base sm:text-lg">
              <span className="text-muted-foreground">Final Score</span>
              <span className="font-bold neon-text text-3xl sm:text-4xl tabular-nums">{score.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={onRestart} 
              className="game-button w-full text-base sm:text-lg py-4 sm:py-6"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              PLAY AGAIN
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mission } from '@/types/Mission';
import { MISSIONS } from '@/data/missions';

interface MissionSelectProps {
  onMissionSelect: (mission: Mission) => void;
  onBack: () => void;
}

export const MissionSelect = ({ onMissionSelect, onBack }: MissionSelectProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-2 sm:p-4">
      <div className="max-w-4xl w-full space-y-4 sm:space-y-6">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold neon-text bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2 sm:mb-4">
            MISSION BRIEFING
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground px-2">
            Select your Kubernetes deployment configuration
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {MISSIONS.map((mission) => (
            <Card key={mission.id} className="p-4 sm:p-6 cyber-border hover:neon-glow transition-all duration-300 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold neon-text">{mission.name}</h2>
                  <Badge 
                    variant={mission.difficulty === 'hard' ? 'destructive' : 'secondary'}
                    className="text-sm"
                  >
                    {mission.difficulty.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs sm:text-sm">
                      {mission.containerCount} Container{mission.containerCount > 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline" className="cyber-border text-xs sm:text-sm">
                      {mission.duration / 60}min Mission
                    </Badge>
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {mission.scoreMultiplier}x Score
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {mission.description}
                  </p>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Mission Objectives:</h3>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {mission.objectives.map((objective, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      Kubernetes Configuration:
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Pod Replicas:</span>
                        <span className="text-primary">{mission.containerCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Load Balancing:</span>
                        <span className="text-primary">{mission.containerCount > 1 ? 'Enabled' : 'Single Node'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto-scaling:</span>
                        <span className="text-primary">{mission.containerCount > 1 ? 'Horizontal' : 'Vertical'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => onMissionSelect(mission)}
                  className="game-button w-full group-hover:scale-105 transition-transform"
                >
                  DEPLOY MISSION
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center pt-4">
          <Button onClick={onBack} variant="outline" className="cyber-border">
            ← BACK TO MAIN MENU
          </Button>
        </div>

        {/* Game Controls Section */}
        <Card className="p-6 cyber-border bg-card/80 backdrop-blur-sm">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold neon-text mb-2">GAME CONTROLS</h3>
            <p className="text-sm text-muted-foreground">Master these controls for both deployment modes</p>
          </div>
          
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Basic Controls */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-primary">Universal Controls</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Move Left:</span>
                  <Badge variant="outline" className="font-mono">A / ←</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Move Right:</span>
                  <Badge variant="outline" className="font-mono">D / →</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fire Weapon:</span>
                  <Badge variant="outline" className="font-mono">SPACE</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pause Game:</span>
                  <Badge variant="outline" className="font-mono">ESC</Badge>
                </div>
              </div>
            </div>

            {/* Advanced Controls for Triple Container */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-primary">Triple Container Mode</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Shield System:</span>
                  <Badge className="bg-gradient-to-r from-primary to-accent">Auto-Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Weapon Upgrades:</span>
                  <Badge className="bg-gradient-to-r from-primary to-accent">Collect Power-ups</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Multi-shot:</span>
                  <Badge className="bg-gradient-to-r from-primary to-accent">Plasma Mode</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Elite Enemies:</span>
                  <Badge variant="destructive">5 HP Required</Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded border-l-4 border-primary">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Pro Tip:</span> Triple container mode features enhanced combat mechanics, 
              shield regeneration, and power-up collection for demonstrating advanced Kubernetes capabilities.
            </p>
          </div>
        </Card>

        <div className="text-center space-y-2 text-xs text-muted-foreground">
          <p>🚀 Perfect for demonstrating Kubernetes horizontal scaling</p>
          <p>📊 Compare single vs multi-container performance in real-time</p>
          <p>⚡ Ideal for tech presentations and DevOps demonstrations</p>
        </div>
      </div>
    </div>
  );
};
interface GameCanvasProps {
  playerX: number;
  playerY: number;
  enemies: Array<{
    id: string;
    x: number;
    y: number;
    health: number;
  }>;
  projectiles: Array<{
    id: string;
    x: number;
    y: number;
  }>;
}

export const GameCanvas = ({ playerX, playerY, enemies, projectiles }: GameCanvasProps) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-slate-800/50 rounded-lg border border-purple-500/30 overflow-hidden shadow-2xl">
        {/* Player */}
        <div 
          className="absolute w-8 h-8 bg-cyan-400 rounded-full transition-all duration-75 shadow-lg shadow-cyan-400/50"
          style={{ 
            left: `${(playerX / 800) * 100}%`, 
            top: `${(playerY / 600) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Enemies */}
        {enemies.map(enemy => (
          <div
            key={enemy.id}
            className="absolute w-6 h-6 bg-red-500 rounded transition-all duration-75 shadow-lg shadow-red-500/50"
            style={{ 
              left: `${(enemy.x / 800) * 100}%`, 
              top: `${(enemy.y / 600) * 100}%`,
              transform: 'translate(-50%, -50%)',
              opacity: enemy.health > 0 ? 1 : 0.5
            }}
          />
        ))}
        
        {/* Projectiles */}
        {projectiles.map(proj => (
          <div
            key={proj.id}
            className="absolute w-2 h-4 bg-yellow-400 rounded-full transition-all duration-75 shadow-lg shadow-yellow-400/50"
            style={{ 
              left: `${(proj.x / 800) * 100}%`, 
              top: `${(proj.y / 600) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
        
        {/* Grid background effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      </div>
    </div>
  );
};

import { memo } from 'react';
import gamerIcon from '@/assets/gamer.png';
import enemyIcon from '@/assets/enemy.png';

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

export const GameCanvas = memo(({ playerX, playerY, enemies, projectiles }: GameCanvasProps) => {
  return (
    <div className="relative w-full max-w-4xl aspect-[4/3] bg-slate-800/50 rounded-lg border border-purple-500/30 overflow-hidden shadow-2xl mx-auto">
        {/* Player */}
        <img 
          src={gamerIcon}
          alt="Player ship"
          className="absolute w-12 h-12 will-change-transform"
          style={{ 
            left: `${(playerX / 800) * 100}%`, 
            top: `${(playerY / 600) * 100}%`,
            transform: 'translate(-50%, -50%)',
            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
          }}
        />
        
        {/* Enemies */}
        {enemies.map(enemy => (
          <img
            key={enemy.id}
            src={enemyIcon}
            alt="Enemy ship"
            className="absolute w-12 h-12 will-change-transform"
            style={{ 
              left: `${(enemy.x / 800) * 100}%`, 
              top: `${(enemy.y / 600) * 100}%`,
              transform: 'translate(-50%, -50%) rotate(180deg)',
              opacity: enemy.health > 0 ? 1 : 0.5,
              filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))'
            }}
          />
        ))}
        
        {/* Projectiles */}
        {projectiles.map(proj => (
          <div
            key={proj.id}
            className="absolute w-2 h-4 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50 will-change-transform"
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
  );
});

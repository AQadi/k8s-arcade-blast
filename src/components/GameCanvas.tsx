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
    isEnemy?: boolean;
  }>;
  isMovingUp?: boolean;
}

export const GameCanvas = memo(({ playerX, playerY, enemies, projectiles, isMovingUp }: GameCanvasProps) => {
  return (
    <div className="relative w-full max-w-4xl aspect-[4/3] bg-slate-800/50 rounded-lg border border-purple-500/30 overflow-hidden shadow-2xl mx-auto">
        {/* Player */}
        <div
          className="absolute will-change-transform"
          style={{ 
            left: `${(playerX / 800) * 100}%`, 
            top: `${(playerY / 600) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Afterburner effect */}
          {isMovingUp && (
            <div className="absolute left-1/2 top-full -translate-x-1/2 flex flex-col items-center">
              <div 
                className="w-4 h-6 rounded-full animate-pulse"
                style={{
                  background: 'linear-gradient(to bottom, #60a5fa, #3b82f6, #f97316, #facc15)',
                  filter: 'blur(2px)',
                  opacity: 0.9,
                }}
              />
              <div 
                className="w-2 h-8 rounded-full -mt-2 animate-pulse"
                style={{
                  background: 'linear-gradient(to bottom, #f97316, #facc15, transparent)',
                  filter: 'blur(3px)',
                  opacity: 0.7,
                  animationDelay: '0.1s',
                }}
              />
            </div>
          )}
          <img 
            src={gamerIcon}
            alt="Player ship"
            className="w-12 h-12"
            style={{ 
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
            }}
          />
        </div>
        
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
            className={`absolute w-2 h-4 rounded-full will-change-transform ${
              proj.isEnemy 
                ? 'bg-red-500 shadow-lg shadow-red-500/50' 
                : 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
            }`}
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

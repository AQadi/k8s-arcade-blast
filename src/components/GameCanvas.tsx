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
  bonuses?: Array<{
    id: string;
    x: number;
    y: number;
    type: 'shield' | 'health';
  }>;
  shieldActive?: boolean;
  isMovingUp?: boolean;
  isMovingLeft?: boolean;
  isMovingRight?: boolean;
}

const GameCanvasComponent = ({ 
  playerX, 
  playerY, 
  enemies, 
  projectiles, 
  bonuses = [],
  shieldActive = false,
  isMovingUp, 
  isMovingLeft, 
  isMovingRight 
}: GameCanvasProps) => {
  // Calculate roll angle based on movement direction
  const rollAngle = isMovingLeft ? -35 : isMovingRight ? 35 : 0;
  
  return (
    <div className="relative w-full max-w-4xl aspect-[4/3] bg-slate-800/50 rounded-lg border border-purple-500/30 overflow-hidden shadow-2xl mx-auto">
        {/* Grid background effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        
        {/* Bonuses */}
        {bonuses.map(bonus => (
          <div
            key={bonus.id}
            className="absolute will-change-transform"
            style={{ 
              left: `${(bonus.x / 800) * 100}%`, 
              top: `${(bonus.y / 600) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {bonus.type === 'shield' ? (
              // Shield bonus - Electric blue
              <div className="relative">
                <div 
                  className="w-8 h-8 rounded-full animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, #00d4ff 0%, #0099cc 50%, #006699 100%)',
                    boxShadow: '0 0 20px #00d4ff, 0 0 40px #00d4ff, inset 0 0 10px rgba(255,255,255,0.5)',
                  }}
                />
                <div 
                  className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs"
                  style={{ textShadow: '0 0 5px #000' }}
                >
                  🛡️
                </div>
              </div>
            ) : (
              // Health bonus - Red
              <div className="relative">
                <div 
                  className="w-8 h-8 rounded-full animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, #ff4444 0%, #cc0000 50%, #990000 100%)',
                    boxShadow: '0 0 20px #ff4444, 0 0 40px #ff4444, inset 0 0 10px rgba(255,255,255,0.5)',
                  }}
                />
                <div 
                  className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs"
                  style={{ textShadow: '0 0 5px #000' }}
                >
                  ❤️
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Shield effect - separate from player to avoid tilting */}
        {shieldActive && (
          <div 
            className="absolute will-change-transform"
            style={{
              left: `${(playerX / 800) * 100}%`, 
              top: `${(playerY / 600) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Outer glow ring */}
            <div 
              className="absolute -inset-6 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #00d4ff, #00ffff, #0099ff, #00d4ff)',
                opacity: 0.4,
                animation: 'spin 2s linear infinite',
              }}
            />
            {/* Inner shield bubble */}
            <div 
              className="absolute -inset-5 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.05) 60%, transparent 70%)',
                border: '2px solid rgba(0,212,255,0.7)',
                boxShadow: '0 0 20px rgba(0,212,255,0.6), inset 0 0 15px rgba(0,212,255,0.3)',
              }}
            />
            {/* Hexagonal pattern overlay */}
            <div 
              className="absolute -inset-5 rounded-full opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2300d4ff' fill-opacity='0.4'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        )}
        
        {/* Player */}
        <div
          className="absolute will-change-transform transition-transform duration-100"
          style={{ 
            left: `${(playerX / 800) * 100}%`, 
            top: `${(playerY / 600) * 100}%`,
            transform: `translate(-50%, -50%) rotateY(${rollAngle}deg)`,
          }}
        >
          {/* Afterburner effect */}
          {isMovingUp && (
            <div 
              className="absolute left-1/2 top-full -translate-x-1/2"
              style={{
                width: '16px',
                height: '24px',
                background: 'linear-gradient(to bottom, #60a5fa, #f97316, #facc15)',
                borderRadius: '50%',
                filter: 'blur(3px)',
                opacity: 0.85,
              }}
            />
          )}
          <img 
            src={gamerIcon}
            alt="Player ship"
            className="w-12 h-12"
            style={{ 
              filter: shieldActive 
                ? 'drop-shadow(0 0 12px rgba(0, 212, 255, 0.9))' 
                : 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
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
      </div>
  );
};

export const GameCanvas = memo(GameCanvasComponent);

import { memo } from 'react';
import gamerIcon from '@/assets/gamer.png';
import enemyIcon from '@/assets/enemy.png';

interface Boss {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
}

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
  boss?: Boss | null;
  bossPhase?: boolean;
  shieldActive?: boolean;
  isMovingUp?: boolean;
  isMovingLeft?: boolean;
  isMovingRight?: boolean;
}

const BossShip = ({ x, y, health, maxHealth }: { x: number; y: number; health: number; maxHealth: number }) => {
  const healthPercent = (health / maxHealth) * 100;
  
  return (
    <div
      className="absolute will-change-transform"
      style={{ 
        left: `${(x / 800) * 100}%`, 
        top: `${(y / 600) * 100}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Enemy flagship health bar */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden border border-red-500/50">
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
        <div className="text-center text-xs text-red-400 font-bold mt-1">ELITE</div>
      </div>
      
      {/* Boss ship - scaled up enemy jet facing forward (towards player) */}
      <svg 
        width="80" 
        height="80" 
        viewBox="0 0 80 80" 
        className="drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
        style={{ transform: 'rotate(180deg)' }}
      >
        <defs>
          <linearGradient id="bossBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a1c1c" />
            <stop offset="50%" stopColor="#7c2d2d" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <linearGradient id="bossWing" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c2d2d" />
            <stop offset="100%" stopColor="#4a1c1c" />
          </linearGradient>
          <filter id="bossGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main fuselage - pointed nose */}
        <path d="M40 5 L48 25 L48 55 L40 65 L32 55 L32 25 Z" fill="url(#bossBody)" stroke="#ef4444" strokeWidth="1.5"/>
        
        {/* Left wing */}
        <path d="M32 30 L8 50 L8 55 L32 45 Z" fill="url(#bossWing)" stroke="#ef4444" strokeWidth="1"/>
        
        {/* Right wing */}
        <path d="M48 30 L72 50 L72 55 L48 45 Z" fill="url(#bossWing)" stroke="#ef4444" strokeWidth="1"/>
        
        {/* Left tail fin */}
        <path d="M32 50 L25 60 L32 58 Z" fill="url(#bossBody)" stroke="#ef4444" strokeWidth="0.5"/>
        
        {/* Right tail fin */}
        <path d="M48 50 L55 60 L48 58 Z" fill="url(#bossBody)" stroke="#ef4444" strokeWidth="0.5"/>
        
        {/* Cockpit */}
        <ellipse cx="40" cy="22" rx="6" ry="10" fill="#1e1e1e" stroke="#ef4444" strokeWidth="1"/>
        <ellipse cx="40" cy="20" rx="4" ry="6" fill="#dc2626" opacity="0.6" filter="url(#bossGlow)"/>
        
        {/* Engine glow at back */}
        <ellipse cx="40" cy="62" rx="6" ry="4" fill="#ff6b6b" opacity="0.9" filter="url(#bossGlow)">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="0.2s" repeatCount="indefinite"/>
        </ellipse>
        
        {/* Left cannon */}
        <rect x="26" y="48" width="4" height="10" rx="1" fill="#ef4444" opacity="0.9"/>
        <circle cx="28" cy="58" r="2" fill="#ff6b6b" filter="url(#bossGlow)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="0.4s" repeatCount="indefinite"/>
        </circle>
        
        {/* Right cannon */}
        <rect x="50" y="48" width="4" height="10" rx="1" fill="#ef4444" opacity="0.9"/>
        <circle cx="52" cy="58" r="2" fill="#ff6b6b" filter="url(#bossGlow)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="0.4s" repeatCount="indefinite"/>
        </circle>
        
        {/* Decorative panel lines */}
        <line x1="36" y1="28" x2="36" y2="48" stroke="#ef4444" strokeWidth="0.5" opacity="0.5"/>
        <line x1="44" y1="28" x2="44" y2="48" stroke="#ef4444" strokeWidth="0.5" opacity="0.5"/>
      </svg>
    </div>
  );
};

const GameCanvasComponent = ({ 
  playerX, 
  playerY, 
  enemies, 
  projectiles, 
  bonuses = [],
  boss = null,
  bossPhase = false,
  shieldActive = false,
  isMovingUp, 
  isMovingLeft, 
  isMovingRight 
}: GameCanvasProps) => {
  const rollAngle = isMovingLeft ? -35 : isMovingRight ? 35 : 0;
  
  return (
    <div className="relative w-full max-w-4xl aspect-[4/3] bg-slate-800/50 rounded-lg border border-purple-500/30 overflow-hidden shadow-2xl mx-auto">
        {/* Grid background effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        
        {/* Boss phase warning overlay */}
        {bossPhase && (
          <div className="absolute inset-0 pointer-events-none border-4 border-red-500/30 animate-pulse" />
        )}
        
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
        
        {/* Boss */}
        {boss && (
          <BossShip x={boss.x} y={boss.y} health={boss.health} maxHealth={boss.maxHealth} />
        )}
        
        {/* Shield effect */}
        {shieldActive && (
          <div 
            className="absolute will-change-transform"
            style={{
              left: `${(playerX / 800) * 100}%`, 
              top: `${(playerY / 600) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div 
              className="absolute -inset-6 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #00d4ff, #00ffff, #0099ff, #00d4ff)',
                opacity: 0.4,
                animation: 'spin 2s linear infinite',
              }}
            />
            <div 
              className="absolute -inset-5 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.05) 60%, transparent 70%)',
                border: '2px solid rgba(0,212,255,0.7)',
                boxShadow: '0 0 20px rgba(0,212,255,0.6), inset 0 0 15px rgba(0,212,255,0.3)',
              }}
            />
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

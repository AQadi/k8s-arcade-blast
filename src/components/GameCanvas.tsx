import { useRef, useEffect } from 'react';
import { GameState } from './SpaceInvaders';

interface GameCanvasProps {
  gameState: GameState;
  width: number;
  height: number;
}

export const GameCanvas = ({ gameState, width, height }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Draw stars background
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(Date.now() * 0.001 + i) * width + width) % width;
      const y = (Math.cos(Date.now() * 0.0005 + i) * height + height) % height;
      ctx.fillStyle = `hsl(180, 100%, ${50 + Math.sin(i) * 20}%)`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw player
    const { player } = gameState;
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Player ship gradient
    const playerGradient = ctx.createLinearGradient(0, -15, 0, 15);
    playerGradient.addColorStop(0, 'hsl(180, 100%, 70%)');
    playerGradient.addColorStop(1, 'hsl(180, 100%, 40%)');
    
    ctx.fillStyle = playerGradient;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-10, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(10, 15);
    ctx.closePath();
    ctx.fill();
    
    // Player glow effect
    ctx.shadowColor = 'hsl(180, 100%, 50%)';
    ctx.shadowBlur = 10;
    ctx.fill();
    
    ctx.restore();

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      
      let enemyColor = 'hsl(0, 100%, 60%)';
      let size = 15;
      
      if (enemy.type === 'elite') {
        enemyColor = 'hsl(280, 100%, 60%)';
        size = 18;
      } else if (enemy.type === 'boss') {
        enemyColor = 'hsl(20, 100%, 50%)';
        size = 25;
      }
      
      const enemyGradient = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size);
      enemyGradient.addColorStop(0, enemyColor);
      enemyGradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');
      
      ctx.fillStyle = enemyGradient;
      ctx.shadowColor = enemyColor;
      ctx.shadowBlur = 8;
      
      if (enemy.type === 'boss') {
        // Boss enemy - larger hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = Math.cos(angle) * size;
          const y = Math.sin(angle) * size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      } else if (enemy.type === 'elite') {
        // Elite enemy - diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Basic enemy - triangle
        ctx.beginPath();
        ctx.moveTo(0, size);
        ctx.lineTo(-size * 0.7, -size * 0.5);
        ctx.lineTo(size * 0.7, -size * 0.5);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    });

    // Draw bullets
    gameState.bullets.forEach(bullet => {
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      
      let bulletColor = 'hsl(120, 100%, 60%)';
      let bulletSize = 3;
      
      if (bullet.type === 'laser') {
        bulletColor = 'hsl(180, 100%, 70%)';
        bulletSize = 4;
      } else if (bullet.type === 'plasma') {
        bulletColor = 'hsl(280, 100%, 70%)';
        bulletSize = 5;
      } else if (bullet.type === 'enemy') {
        bulletColor = 'hsl(0, 100%, 60%)';
      }
      
      const bulletGradient = ctx.createRadialGradient(0, 0, bulletSize * 0.5, 0, 0, bulletSize * 2);
      bulletGradient.addColorStop(0, bulletColor);
      bulletGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
      
      ctx.fillStyle = bulletGradient;
      ctx.shadowColor = bulletColor;
      ctx.shadowBlur = 6;
      
      ctx.beginPath();
      ctx.arc(0, 0, bulletSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw power-ups (triple container mode only)
    gameState.powerUps.forEach(powerUp => {
      ctx.save();
      ctx.translate(powerUp.x, powerUp.y);
      
      let powerUpColor = 'hsl(120, 100%, 60%)';
      
      switch (powerUp.type) {
        case 'health':
          powerUpColor = 'hsl(120, 100%, 60%)';
          break;
        case 'shield':
          powerUpColor = 'hsl(200, 100%, 60%)';
          break;
        case 'weapon':
          powerUpColor = 'hsl(60, 100%, 60%)';
          break;
        case 'speed':
          powerUpColor = 'hsl(300, 100%, 60%)';
          break;
      }
      
      const powerUpGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 12);
      powerUpGradient.addColorStop(0, powerUpColor);
      powerUpGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      
      ctx.fillStyle = powerUpGradient;
      ctx.shadowColor = powerUpColor;
      ctx.shadowBlur = 10;
      
      // Rotating square for power-ups
      ctx.rotate(Date.now() * 0.005);
      ctx.fillRect(-8, -8, 16, 16);
      
      ctx.restore();
    });

    // Draw particle effects
    const time = Date.now() * 0.01;
    for (let i = 0; i < 20; i++) {
      const x = (Math.sin(time + i) * width * 0.3 + width * 0.5) % width;
      const y = (Math.cos(time * 0.7 + i) * height * 0.2 + height * 0.3) % height;
      const alpha = Math.sin(time + i) * 0.3 + 0.3;
      
      ctx.fillStyle = `hsla(180, 100%, 70%, ${alpha})`;
      ctx.fillRect(x, y, 2, 2);
    }

  }, [gameState, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border cyber-border neon-glow bg-background/20"
    />
  );
};
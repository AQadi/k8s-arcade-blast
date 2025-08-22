import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameCanvas } from './GameCanvas';
import { GameHUD } from './GameHUD';
import { GameOverScreen } from './GameOverScreen';
import { useKeyboard } from '@/hooks/useKeyboard';

export interface GameState {
  player: {
    x: number;
    y: number;
    health: number;
    maxHealth: number;
  };
  enemies: Array<{
    id: string;
    x: number;
    y: number;
    type: 'basic' | 'elite' | 'boss';
  }>;
  bullets: Array<{
    id: string;
    x: number;
    y: number;
    type: 'player' | 'enemy';
  }>;
  score: number;
  level: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver';
  timeRemaining: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;

export const SpaceInvaders = () => {
  const [gameState, setGameState] = useState<GameState>({
    player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80, health: 100, maxHealth: 100 },
    enemies: [],
    bullets: [],
    score: 0,
    level: 1,
    gameStatus: 'menu',
    timeRemaining: 120, // 2 minutes per round
  });

  const gameLoopRef = useRef<number>();
  const lastShotTime = useRef(0);
  const enemySpawnTimer = useRef(0);

  const keys = useKeyboard();

  const resetGame = useCallback(() => {
    setGameState({
      player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80, health: 100, maxHealth: 100 },
      enemies: [],
      bullets: [],
      score: 0,
      level: 1,
      gameStatus: 'playing',
      timeRemaining: 120,
    });
  }, []);

  const startGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'paused' ? 'playing' : 'paused'
    }));
  }, []);

  const gameLoop = useCallback(() => {
    setGameState(prevState => {
      if (prevState.gameStatus !== 'playing') return prevState;

      const newState = { ...prevState };
      const currentTime = Date.now();

      // Handle player movement
      if (keys.a || keys.ArrowLeft) {
        newState.player.x = Math.max(20, newState.player.x - PLAYER_SPEED);
      }
      if (keys.d || keys.ArrowRight) {
        newState.player.x = Math.min(GAME_WIDTH - 20, newState.player.x + PLAYER_SPEED);
      }
      if (keys.w || keys.ArrowUp) {
        newState.player.y = Math.max(20, newState.player.y - PLAYER_SPEED);
      }
      if (keys.s || keys.ArrowDown) {
        newState.player.y = Math.min(GAME_HEIGHT - 20, newState.player.y + PLAYER_SPEED);
      }

      // Handle shooting
      if ((keys[' '] || keys.Enter) && currentTime - lastShotTime.current > 200) {
        newState.bullets.push({
          id: `bullet-${currentTime}`,
          x: newState.player.x,
          y: newState.player.y - 20,
          type: 'player'
        });
        lastShotTime.current = currentTime;
      }

      // Spawn enemies
      enemySpawnTimer.current++;
      if (enemySpawnTimer.current > 60) { // Spawn every 60 frames
        const enemyType = Math.random() < 0.1 ? 'elite' : 'basic';
        newState.enemies.push({
          id: `enemy-${currentTime}`,
          x: Math.random() * (GAME_WIDTH - 40) + 20,
          y: -20,
          type: enemyType
        });
        enemySpawnTimer.current = 0;
      }

      // Move bullets
      newState.bullets = newState.bullets
        .map(bullet => ({
          ...bullet,
          y: bullet.type === 'player' ? bullet.y - BULLET_SPEED : bullet.y + BULLET_SPEED
        }))
        .filter(bullet => bullet.y > -20 && bullet.y < GAME_HEIGHT + 20);

      // Move enemies
      newState.enemies = newState.enemies
        .map(enemy => ({ ...enemy, y: enemy.y + 2 }))
        .filter(enemy => enemy.y < GAME_HEIGHT + 50);

      // Check collisions
      newState.bullets = newState.bullets.filter(bullet => {
        if (bullet.type === 'player') {
          const hitEnemy = newState.enemies.find(enemy => 
            Math.abs(enemy.x - bullet.x) < 25 && Math.abs(enemy.y - bullet.y) < 25
          );
          if (hitEnemy) {
            newState.enemies = newState.enemies.filter(e => e.id !== hitEnemy.id);
            newState.score += hitEnemy.type === 'elite' ? 200 : 100;
            return false;
          }
        }
        return true;
      });

      // Check enemy collision with player
      const playerHit = newState.enemies.find(enemy =>
        Math.abs(enemy.x - newState.player.x) < 30 && Math.abs(enemy.y - newState.player.y) < 30
      );
      if (playerHit) {
        newState.enemies = newState.enemies.filter(e => e.id !== playerHit.id);
        newState.player.health -= 20;
      }

      // Update timer
      newState.timeRemaining = Math.max(0, newState.timeRemaining - 1/60);

      // Check game over conditions
      if (newState.player.health <= 0 || newState.timeRemaining <= 0) {
        newState.gameStatus = 'gameOver';
      }

      return newState;
    });
  }, [keys]);

  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      gameLoopRef.current = requestAnimationFrame(function animate() {
        gameLoop();
        gameLoopRef.current = requestAnimationFrame(animate);
      });
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStatus, gameLoop]);

  // Handle pause with Escape key
  useEffect(() => {
    if (keys.Escape && gameState.gameStatus === 'playing') {
      pauseGame();
    }
  }, [keys.Escape, gameState.gameStatus, pauseGame]);

  if (gameState.gameStatus === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 cyber-border neon-glow">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-bold neon-text bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SPACE INVADERS
            </h1>
            <p className="text-xl text-muted-foreground">Battle Royale Edition</p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Controls: WASD or Arrow Keys to move</p>
              <p>SPACEBAR or ENTER to shoot</p>
              <p>ESC to pause</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Kubernetes Demo Ready
            </Badge>
            <Button onClick={startGame} className="game-button text-lg px-8 py-4">
              START MISSION
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState.gameStatus === 'gameOver') {
    return (
      <GameOverScreen 
        score={gameState.score}
        level={gameState.level}
        onRestart={startGame}
        onMenu={() => setGameState(prev => ({ ...prev, gameStatus: 'menu' }))}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <GameHUD gameState={gameState} onPause={pauseGame} />
      <div className="relative">
        <GameCanvas gameState={gameState} width={GAME_WIDTH} height={GAME_HEIGHT} />
        {gameState.gameStatus === 'paused' && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Card className="p-6 cyber-border neon-glow">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold neon-text">PAUSED</h2>
                <p className="text-muted-foreground">Press ESC to continue</p>
                <Button onClick={pauseGame} className="game-button">
                  RESUME
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
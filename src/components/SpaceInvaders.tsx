import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameCanvas } from './GameCanvas';
import { GameHUD } from './GameHUD';
import { GameOverScreen } from './GameOverScreen';
import { MissionSelect } from './MissionSelect';
import { MetricsDashboard } from './MetricsDashboard';
import { TestResults } from './TestResults';
import { useKeyboard } from '@/hooks/useKeyboard';
import { Mission } from '@/types/Mission';
import { getMissionById } from '@/data/missions';
import { GameTestSuite } from '@/utils/testUtils';
import { supabase } from '@/integrations/supabase/client';

export interface GameState {
  player: {
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    weaponLevel: number;
  };
  enemies: Array<{
    id: string;
    x: number;
    y: number;
    type: 'basic' | 'elite' | 'boss';
    health: number;
  }>;
  bullets: Array<{
    id: string;
    x: number;
    y: number;
    type: 'player' | 'enemy' | 'laser' | 'plasma';
  }>;
  powerUps: Array<{
    id: string;
    x: number;
    y: number;
    type: 'health' | 'shield' | 'weapon' | 'speed';
  }>;
  score: number;
  level: number;
  gameStatus: 'menu' | 'missionSelect' | 'playing' | 'paused' | 'gameOver';
  timeRemaining: number;
  currentMission?: Mission;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;

export const SpaceInvaders = () => {
  console.log('SpaceInvaders component rendering');
  const [gameState, setGameState] = useState<GameState>({
    player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80, health: 100, maxHealth: 100, shield: 0, maxShield: 100, weaponLevel: 1 },
    enemies: [],
    bullets: [],
    powerUps: [],
    score: 0,
    level: 1,
    gameStatus: 'playing',
    timeRemaining: 60,
    currentMission: getMissionById('single-container'),
  });

  const gameLoopRef = useRef<number>();
  const lastShotTime = useRef(0);
  const enemySpawnTimer = useRef(0);
  const powerUpSpawnTimer = useRef(0);
  const shieldRegenTimer = useRef(0);

  const keys = useKeyboard();

  const resetGame = useCallback((mission?: Mission) => {
    const missionDuration = mission?.duration || 60;
    setGameState({
      player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80, health: 100, maxHealth: 100, shield: mission?.containerCount === 3 ? 50 : 0, maxShield: 100, weaponLevel: 1 },
      enemies: [],
      bullets: [],
      powerUps: [],
      score: 0,
      level: 1,
      gameStatus: 'playing',
      timeRemaining: missionDuration,
      currentMission: mission,
    });
  }, []);

  const startMissionSelect = useCallback(() => {
    setGameState(prev => ({ ...prev, gameStatus: 'missionSelect' }));
  }, []);

  const selectMission = useCallback((mission: Mission) => {
    resetGame(mission);
  }, [resetGame]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'paused' ? 'playing' : 'paused'
    }));
  }, []);

  const endGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gameStatus: 'gameOver' }));
  }, []);

  const gameLoop = useCallback(() => {
    setGameState(prevState => {
      if (prevState.gameStatus !== 'playing') return prevState;

      const newState = { ...prevState };
      const currentTime = Date.now();
      const mission = newState.currentMission;
      const spawnRate = mission?.enemySpawnRate || 60;

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

      // Handle shooting (enhanced for triple container mode)
      if ((keys[' '] || keys.Enter) && currentTime - lastShotTime.current > (mission?.containerCount === 3 ? 150 : 200)) {
        // Trigger server-side action when space is pressed
        fetch('/api/game-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'shoot' })
        }).then(res => res.json()).then((data) => {
          const error = null;
          if (error) {
            console.error('Server action error:', error);
          } else {
            console.log('Server response:', data);
          }
        });

        if (mission?.containerCount === 3 && newState.player.weaponLevel > 1) {
          // Multi-shot for triple container mode
          for (let i = 0; i < newState.player.weaponLevel; i++) {
            newState.bullets.push({
              id: `bullet-${currentTime}-${i}`,
              x: newState.player.x + (i - 1) * 15,
              y: newState.player.y - 20,
              type: newState.player.weaponLevel > 2 ? 'plasma' : 'laser'
            });
          }
        } else {
          newState.bullets.push({
            id: `bullet-${currentTime}`,
            x: newState.player.x,
            y: newState.player.y - 20,
            type: 'player'
          });
        }
        lastShotTime.current = currentTime;
      }

      // Spawn enemies based on mission difficulty
      enemySpawnTimer.current++;
      if (enemySpawnTimer.current > spawnRate) {
        const eliteChance = mission?.containerCount === 3 ? 0.4 : mission?.difficulty === 'hard' ? 0.3 : 0.1;
        const bossChance = mission?.containerCount === 3 ? 0.05 : 0;
        
        let enemyType: 'basic' | 'elite' | 'boss' = 'basic';
        const rand = Math.random();
        if (rand < bossChance) enemyType = 'boss';
        else if (rand < eliteChance + bossChance) enemyType = 'elite';
        
        newState.enemies.push({
          id: `enemy-${currentTime}`,
          x: Math.random() * (GAME_WIDTH - 40) + 20,
          y: -20,
          type: enemyType,
          health: enemyType === 'boss' ? 5 : enemyType === 'elite' ? 2 : 1
        });
        enemySpawnTimer.current = 0;
      }

      // Spawn power-ups (only in triple container mode)
      if (mission?.containerCount === 3) {
        powerUpSpawnTimer.current++;
        if (powerUpSpawnTimer.current > 600) { // Every 10 seconds
          const powerUpTypes = ['health', 'shield', 'weapon', 'speed'];
          const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)] as any;
          
          newState.powerUps.push({
            id: `powerup-${currentTime}`,
            x: Math.random() * (GAME_WIDTH - 40) + 20,
            y: -20,
            type: powerUpType
          });
          powerUpSpawnTimer.current = 0;
        }
      }

      // Move bullets
      newState.bullets = newState.bullets
        .map(bullet => ({
          ...bullet,
          y: bullet.type === 'player' || bullet.type === 'laser' || bullet.type === 'plasma' ? bullet.y - BULLET_SPEED : bullet.y + BULLET_SPEED
        }))
        .filter(bullet => bullet.y > -20 && bullet.y < GAME_HEIGHT + 20);

      // Move enemies and power-ups
      newState.enemies = newState.enemies
        .map(enemy => ({ ...enemy, y: enemy.y + (enemy.type === 'boss' ? 1 : 2) }))
        .filter(enemy => enemy.y < GAME_HEIGHT + 50);

      newState.powerUps = newState.powerUps
        .map(powerUp => ({ ...powerUp, y: powerUp.y + 3 }))
        .filter(powerUp => powerUp.y < GAME_HEIGHT + 20);

      // Check collisions
      newState.bullets = newState.bullets.filter(bullet => {
        if (bullet.type === 'player' || bullet.type === 'laser' || bullet.type === 'plasma') {
          const hitEnemy = newState.enemies.find(enemy => 
            Math.abs(enemy.x - bullet.x) < 25 && Math.abs(enemy.y - bullet.y) < 25
          );
          if (hitEnemy) {
            hitEnemy.health--;
            if (hitEnemy.health <= 0) {
              newState.enemies = newState.enemies.filter(e => e.id !== hitEnemy.id);
              const baseScore = hitEnemy.type === 'boss' ? 500 : hitEnemy.type === 'elite' ? 200 : 100;
              const missionMultiplier = mission?.scoreMultiplier || 1.0;
              newState.score += Math.floor(baseScore * missionMultiplier);
            }
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
        const damage = playerHit.type === 'boss' ? 30 : playerHit.type === 'elite' ? 20 : 10;
        
        // Shield absorbs damage first in triple container mode
        if (newState.player.shield > 0) {
          const shieldDamage = Math.min(damage, newState.player.shield);
          newState.player.shield -= shieldDamage;
          const remainingDamage = damage - shieldDamage;
          newState.player.health -= remainingDamage;
        } else {
          newState.player.health -= damage;
        }
      }

      // Check power-up collision with player (triple container mode)
      if (mission?.containerCount === 3) {
        const collectedPowerUp = newState.powerUps.find(powerUp =>
          Math.abs(powerUp.x - newState.player.x) < 25 && Math.abs(powerUp.y - newState.player.y) < 25
        );
        if (collectedPowerUp) {
          newState.powerUps = newState.powerUps.filter(p => p.id !== collectedPowerUp.id);
          
          switch (collectedPowerUp.type) {
            case 'health':
              newState.player.health = Math.min(newState.player.maxHealth, newState.player.health + 25);
              break;
            case 'shield':
              newState.player.shield = Math.min(newState.player.maxShield, newState.player.shield + 50);
              break;
            case 'weapon':
              newState.player.weaponLevel = Math.min(3, newState.player.weaponLevel + 1);
              break;
            case 'speed':
              newState.score += 100; // Speed boost gives score
              break;
          }
        }

        // Shield regeneration
        shieldRegenTimer.current++;
        if (shieldRegenTimer.current > 120 && newState.player.shield < newState.player.maxShield) { // Every 2 seconds
          newState.player.shield = Math.min(newState.player.maxShield, newState.player.shield + 1);
          shieldRegenTimer.current = 0;
        }
      }

      // Update timer
      newState.timeRemaining = Math.max(0, newState.timeRemaining - 1/60);

      // Run functional tests periodically
      if (Math.random() < 0.01) { // 1% chance per frame (~0.6 times per second)
        GameTestSuite.runFullTestSuite(newState, keys, []);
      }

      // Check game over conditions - auto restart instead of showing game over
      if (newState.player.health <= 0 || newState.timeRemaining <= 0) {
        const currentMission = newState.currentMission || getMissionById('single-container');
        return {
          player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 80, health: 100, maxHealth: 100, shield: currentMission?.containerCount === 3 ? 50 : 0, maxShield: 100, weaponLevel: 1 },
          enemies: [],
          bullets: [],
          powerUps: [],
          score: 0,
          level: 1,
          gameStatus: 'playing',
          timeRemaining: currentMission?.duration || 60,
          currentMission: currentMission,
        };
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
    console.log('Rendering menu screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 cyber-border neon-glow">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-bold neon-text bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SPACE INVADERS
            </h1>
            <p className="text-xl text-muted-foreground">Kubernetes Battle Royale</p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Controls: WASD or Arrow Keys to move</p>
              <p>SPACEBAR or ENTER to shoot</p>
              <p>ESC to pause</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Container Orchestration Demo
            </Badge>
            <Button onClick={startMissionSelect} className="game-button text-lg px-8 py-4">
              SELECT MISSION
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState.gameStatus === 'missionSelect') {
    return (
      <MissionSelect 
        onMissionSelect={selectMission}
        onBack={() => setGameState(prev => ({ ...prev, gameStatus: 'menu' }))}
      />
    );
  }

  if (gameState.gameStatus === 'gameOver') {
    return (
      <GameOverScreen 
        score={gameState.score}
        level={gameState.level}
        mission={gameState.currentMission}
        onRestart={() => selectMission(gameState.currentMission!)}
        onNewMission={startMissionSelect}
        onMenu={() => setGameState(prev => ({ ...prev, gameStatus: 'menu' }))}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* Left side - Game Section */}
        <div className="flex-1 flex flex-col">
          <GameHUD gameState={gameState} onPause={pauseGame} onEndGame={endGame} />
          
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-full max-w-3xl aspect-[4/3]">
              <GameCanvas 
                gameState={gameState} 
                width={Math.min(GAME_WIDTH, window.innerWidth - (window.innerWidth > 1024 ? 400 : 32))} 
                height={Math.min(GAME_HEIGHT, (window.innerWidth - (window.innerWidth > 1024 ? 400 : 32)) * 0.75)} 
              />
              
              {gameState.gameStatus === 'paused' && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Card className="p-4 sm:p-6 cyber-border neon-glow">
                    <div className="text-center space-y-4">
                      <h2 className="text-2xl sm:text-3xl font-bold neon-text">PAUSED</h2>
                      <p className="text-sm sm:text-base text-muted-foreground">Press ESC to continue</p>
                      <Button onClick={pauseGame} className="game-button">
                        RESUME
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right side - Metrics Dashboard */}
        <div className="lg:w-60 xl:w-64">
          <MetricsDashboard gameState={gameState} />
        </div>
      </div>
      
      {/* Test Results Overlay */}
      <TestResults />
    </div>
  );
};
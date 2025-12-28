import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface Bonus {
  id: string;
  x: number;
  y: number;
  type: 'shield' | 'health';
  speed: number;
}

interface Boss {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  direction: number; // 1 = right, -1 = left
  speed: number;
}

interface GameState {
  player: {
    x: number;
    y: number;
    health: number;
    shieldActive: boolean;
    shieldEndTime: number;
  };
  enemies: Array<{
    id: string;
    x: number;
    y: number;
    health: number;
    speed: number;
  }>;
  projectiles: Array<{
    id: string;
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    isEnemy: boolean;
  }>;
  bonuses: Bonus[];
  boss: Boss | null;
  bossPhase: boolean;
  score: number;
  wave: number;
  gameOver: boolean;
  intensity: number;
}

interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const PROJECTILE_SPEED = 8;
const ENEMY_PROJECTILE_SPEED = 5;
const ENEMY_SPAWN_INTERVAL = 2000;
const BONUS_SPAWN_INTERVAL = 8000;
const BONUS_SPEED = 2;
const SHIELD_DURATION = 10000;
const ENEMY_FIRE_CHANCE = 0.01;
const TICK_RATE = 1000 / 60;

// Boss phase constants
const BOSS_PHASE_INTERVAL = 25000; // 25 seconds
const BOSS_HEALTH = 1000; // 10x normal (20 shots at 50 damage each)
const BOSS_SPEED = 3;
const BOSS_FIRE_RATE = 1200; // Fire every 1.2 seconds (slower)

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let gameState: GameState = {
    player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100, health: 100, shieldActive: false, shieldEndTime: 0 },
    enemies: [],
    projectiles: [],
    bonuses: [],
    boss: null,
    bossPhase: false,
    score: 0,
    wave: 1,
    gameOver: false,
    intensity: 1
  };

  let currentInput: PlayerInput = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false
  };

  let lastShootTime = 0;
  let lastEnemySpawn = 0;
  let lastBonusSpawn = 0;
  let lastBossFire = 0;
  let phaseStartTime = Date.now();
  let gameLoopInterval: number | null = null;

  socket.onopen = () => {
    console.log("Client connected to game server");
    phaseStartTime = Date.now();
    
    gameLoopInterval = setInterval(() => {
      if (!gameState.gameOver) {
        updateGameState();
      }
      socket.send(JSON.stringify({ type: "state", data: gameState }));
    }, TICK_RATE);
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === "input") {
        currentInput = message.data;
      } else if (message.type === "restart") {
        restartGame();
      } else if (message.type === "serverLoad") {
        simulateServerLoad();
      } else if (message.type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  socket.onclose = () => {
    console.log("Client disconnected");
    if (gameLoopInterval) {
      clearInterval(gameLoopInterval);
    }
  };

  function spawnBoss() {
    gameState.boss = {
      id: crypto.randomUUID(),
      x: GAME_WIDTH / 2,
      y: 80,
      health: BOSS_HEALTH,
      maxHealth: BOSS_HEALTH,
      direction: 1,
      speed: BOSS_SPEED
    };
    gameState.bossPhase = true;
    // Clear existing enemies when boss spawns
    gameState.enemies = [];
    console.log("Boss spawned!");
  }

  function updateBoss(now: number) {
    const boss = gameState.boss;
    if (!boss) return;

    // Move boss side to side
    boss.x += boss.speed * boss.direction;

    // Reverse direction at edges
    if (boss.x >= GAME_WIDTH - 60) {
      boss.direction = -1;
    } else if (boss.x <= 60) {
      boss.direction = 1;
    }

    // Boss fires two parallel rows facing forward (towards player)
    if (now - lastBossFire > BOSS_FIRE_RATE) {
      // Left cannon (straight down)
      gameState.projectiles.push({
        id: crypto.randomUUID(),
        x: boss.x - 20,
        y: boss.y + 40,
        velocityX: 0,
        velocityY: ENEMY_PROJECTILE_SPEED,
        isEnemy: true,
      });

      // Right cannon (straight down)
      gameState.projectiles.push({
        id: crypto.randomUUID(),
        x: boss.x + 20,
        y: boss.y + 40,
        velocityX: 0,
        velocityY: ENEMY_PROJECTILE_SPEED,
        isEnemy: true,
      });

      lastBossFire = now;
    }

    // Check player projectile collision with boss
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      if (proj.isEnemy) continue;

      const dist = Math.hypot(proj.x - boss.x, proj.y - boss.y);
      if (dist < 50) {
        boss.health -= 50;
        gameState.projectiles.splice(i, 1);

        if (boss.health <= 0) {
          gameState.score += 1000; // Big bonus for defeating boss
          gameState.boss = null;
          gameState.bossPhase = false;
          phaseStartTime = now; // Reset phase timer for normal mode
          console.log("Boss defeated!");
          return; // CRITICAL: stop using boss after nulling it
        }
      }
    }
  }

  function updateGameState() {
    const now = Date.now();

    // Check for phase transitions
    const timeSincePhaseStart = now - phaseStartTime;
    
    if (!gameState.bossPhase && timeSincePhaseStart >= BOSS_PHASE_INTERVAL) {
      spawnBoss();
      phaseStartTime = now;
    }

    // Check if shield has expired
    if (gameState.player.shieldActive && now >= gameState.player.shieldEndTime) {
      gameState.player.shieldActive = false;
      gameState.player.shieldEndTime = 0;
    }

    // Update player position
    if (currentInput.left && gameState.player.x > 20) {
      gameState.player.x -= PLAYER_SPEED;
    }
    if (currentInput.right && gameState.player.x < GAME_WIDTH - 20) {
      gameState.player.x += PLAYER_SPEED;
    }
    if (currentInput.up && gameState.player.y > 20) {
      gameState.player.y -= PLAYER_SPEED;
    }
    if (currentInput.down && gameState.player.y < GAME_HEIGHT - 20) {
      gameState.player.y += PLAYER_SPEED;
    }

    // Handle shooting
    if (currentInput.shoot && now - lastShootTime > 200) {
      gameState.projectiles.push({
        id: crypto.randomUUID(),
        x: gameState.player.x,
        y: gameState.player.y - 20,
        velocityX: 0,
        velocityY: -PROJECTILE_SPEED,
        isEnemy: false
      });
      lastShootTime = now;
    }

    // Update boss if in boss phase
    if (gameState.bossPhase && gameState.boss) {
      updateBoss(now);
    }

    // Spawn enemies only if NOT in boss phase
    if (!gameState.bossPhase && now - lastEnemySpawn > ENEMY_SPAWN_INTERVAL / gameState.intensity) {
      gameState.enemies.push({
        id: crypto.randomUUID(),
        x: Math.random() * (GAME_WIDTH - 40) + 20,
        y: -20,
        health: 100,
        speed: 1 + (gameState.wave * 0.2)
      });
      lastEnemySpawn = now;
    }

    // Spawn bonuses
    if (now - lastBonusSpawn > BONUS_SPAWN_INTERVAL) {
      const bonusType: 'shield' | 'health' = Math.random() > 0.5 ? 'shield' : 'health';
      gameState.bonuses.push({
        id: crypto.randomUUID(),
        x: Math.random() * (GAME_WIDTH - 60) + 30,
        y: -20,
        type: bonusType,
        speed: BONUS_SPEED
      });
      lastBonusSpawn = now;
    }

    // Update bonuses
    gameState.bonuses = gameState.bonuses.filter(bonus => {
      bonus.y += bonus.speed;
      
      const distToPlayer = Math.hypot(
        bonus.x - gameState.player.x,
        bonus.y - gameState.player.y
      );
      
      if (distToPlayer < 35) {
        if (bonus.type === 'shield') {
          gameState.player.shieldActive = true;
          gameState.player.shieldEndTime = now + SHIELD_DURATION;
        } else if (bonus.type === 'health') {
          gameState.player.health = Math.min(100, gameState.player.health + 15);
        }
        return false;
      }
      
      return bonus.y < GAME_HEIGHT + 20;
    });

    // Update projectiles (now with velocityX support)
    gameState.projectiles = gameState.projectiles.filter(proj => {
      proj.x += proj.velocityX;
      proj.y += proj.velocityY;
      
      // Check enemy projectile collision with player
      if (proj.isEnemy && !gameState.player.shieldActive) {
        const distToPlayer = Math.hypot(
          proj.x - gameState.player.x,
          proj.y - gameState.player.y
        );
        if (distToPlayer < 25) {
          gameState.player.health -= 10;
          if (gameState.player.health <= 0) {
            gameState.gameOver = true;
          }
          return false;
        }
      } else if (proj.isEnemy && gameState.player.shieldActive) {
        const distToPlayer = Math.hypot(
          proj.x - gameState.player.x,
          proj.y - gameState.player.y
        );
        if (distToPlayer < 35) {
          return false;
        }
      }
      
      return proj.x > -20 && proj.x < GAME_WIDTH + 20 && proj.y > -20 && proj.y < GAME_HEIGHT + 20;
    });

    // Update enemies
    gameState.enemies = gameState.enemies.filter(enemy => {
      enemy.y += enemy.speed;
      
      if (enemy.y > 0 && enemy.y < GAME_HEIGHT - 100 && Math.random() < ENEMY_FIRE_CHANCE) {
        gameState.projectiles.push({
          id: crypto.randomUUID(),
          x: enemy.x,
          y: enemy.y + 20,
          velocityX: 0,
          velocityY: ENEMY_PROJECTILE_SPEED,
          isEnemy: true
        });
      }
      
      const distToPlayer = Math.hypot(
        enemy.x - gameState.player.x,
        enemy.y - gameState.player.y
      );
      
      if (distToPlayer < 40) {
        if (!gameState.player.shieldActive) {
          gameState.player.health -= 10;
          if (gameState.player.health <= 0) {
            gameState.gameOver = true;
          }
        }
        return false;
      }
      
      return enemy.y < GAME_HEIGHT + 20;
    });

    // Check player projectile-enemy collisions
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      if (proj.isEnemy) continue;
      
      for (let j = gameState.enemies.length - 1; j >= 0; j--) {
        const enemy = gameState.enemies[j];
        const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
        
        if (dist < 30) {
          enemy.health -= 50;
          gameState.projectiles.splice(i, 1);
          
          if (enemy.health <= 0) {
            gameState.score += 100;
            gameState.enemies.splice(j, 1);
          }
          break;
        }
      }
    }

    gameState.intensity = Math.min(3, 1 + Math.floor(gameState.score / 1000) * 0.5);
    gameState.wave = Math.floor(gameState.score / 500) + 1;
  }

  function restartGame() {
    gameState = {
      player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100, health: 100, shieldActive: false, shieldEndTime: 0 },
      enemies: [],
      projectiles: [],
      bonuses: [],
      boss: null,
      bossPhase: false,
      score: 0,
      wave: 1,
      gameOver: false,
      intensity: 1
    };
    lastShootTime = 0;
    lastEnemySpawn = 0;
    lastBonusSpawn = 0;
    lastBossFire = 0;
    phaseStartTime = Date.now();
  }

  function simulateServerLoad() {
    let result = 0;
    const iterations = 100000;
    
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
      result = result % 1000000;
    }
    
    console.log("Server load simulation completed:", result);
  }

  return response;
});

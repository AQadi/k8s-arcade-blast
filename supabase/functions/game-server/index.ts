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

  // Throttle server -> client state pushes to reduce payload/CPU pressure.
  // Simulation can still run at 60fps, but we only serialize + send at ~20fps.
  const SERVER_STATE_PUSH_RATE_MS = 50;
  let lastStateSent = 0;

  // Hard caps to prevent runaway CPU/memory if entity counts spike.
  const MAX_ENEMIES = 50;
  const MAX_PROJECTILES = 350;
  const MAX_BONUSES = 12;

  const ensureCapacity = <T,>(arr: T[], max: number, extra: number = 1) => {
    const overflow = arr.length + extra - max;
    if (overflow > 0) arr.splice(0, overflow);
  };

  // Lightweight server-side perf telemetry (logged periodically).
  let perfCollisionEstimate = 0;
  let perfTickCount = 0;
  let perfAccUpdateMs = 0;
  let perfAccSerializeMs = 0;
  let perfAccTickMs = 0;
  let perfLastLog = Date.now();
  let perfMaxEnemies = 0;
  let perfMaxProjectiles = 0;

  socket.onopen = () => {
    console.log("Client connected to game server");
    phaseStartTime = Date.now();

    gameLoopInterval = setInterval(() => {
      const tickStart = performance.now();

      try {
        const updateStart = performance.now();
        if (!gameState.gameOver) {
          updateGameState();
        }
        const updateMs = performance.now() - updateStart;

        const now = Date.now();
        let serializeMs = 0;

        if (now - lastStateSent >= SERVER_STATE_PUSH_RATE_MS) {
          lastStateSent = now;

          // Deno WebSocket.OPEN === 1, avoid relying on global constant.
          if (socket.readyState === 1) {
            const serStart = performance.now();
            const payload = JSON.stringify({ type: "state", data: gameState });
            serializeMs = performance.now() - serStart;
            socket.send(payload);
          }
        }

        const tickMs = performance.now() - tickStart;
        perfTickCount += 1;
        perfAccUpdateMs += updateMs;
        perfAccSerializeMs += serializeMs;
        perfAccTickMs += tickMs;
        perfMaxEnemies = Math.max(perfMaxEnemies, gameState.enemies.length);
        perfMaxProjectiles = Math.max(perfMaxProjectiles, gameState.projectiles.length);

        if (Date.now() - perfLastLog >= 10000) {
          const denom = Math.max(1, perfTickCount);
          console.log(
            `[PERF] avgTick=${(perfAccTickMs / denom).toFixed(2)}ms ` +
              `avgUpdate=${(perfAccUpdateMs / denom).toFixed(2)}ms ` +
              `avgSerialize=${(perfAccSerializeMs / denom).toFixed(2)}ms ` +
              `enemies(max)=${perfMaxEnemies} projectiles(max)=${perfMaxProjectiles} ` +
              `collisionEst(max)=${perfCollisionEstimate}`
          );
          perfLastLog = Date.now();
          perfTickCount = 0;
          perfAccUpdateMs = 0;
          perfAccSerializeMs = 0;
          perfAccTickMs = 0;
          perfMaxEnemies = 0;
          perfMaxProjectiles = 0;
          perfCollisionEstimate = 0;
        }
      } catch (err) {
        // IMPORTANT: prevent a single exception from taking down the whole websocket session.
        console.error("Game loop tick error (prevented crash):", err);
      }
    }, TICK_RATE);
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === "input") {
        currentInput = message.data;
      } else if (message.type === "resume") {
        const p = message.data as Partial<{ score: number; wave: number; intensity: number }>;

        // Only allow resume when we are at a fresh state (prevents mid-run tampering).
        if (typeof p?.score === "number" && p.score > 0 && gameState.score === 0) {
          gameState.score = Math.floor(p.score);
          if (typeof p.wave === "number") {
            gameState.wave = Math.max(1, Math.floor(p.wave));
          }
          if (typeof p.intensity === "number") {
            gameState.intensity = Math.max(1, Math.min(3, p.intensity));
          }
          // Reset phase timer to avoid immediate elite phase after reconnect.
          phaseStartTime = Date.now();
          console.log("Resumed progress from client", {
            score: gameState.score,
            wave: gameState.wave,
            intensity: gameState.intensity,
          });
        }
      } else if (message.type === "restart") {
        restartGame();
      } else if (message.type === "serverLoad") {
        simulateServerLoad();
      } else if (message.type === "ping") {
        if (socket.readyState === 1) {
          socket.send(JSON.stringify({ type: "pong" }));
        }
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
    // Avoid firing immediately on spawn (prevents bursty traffic/spikes)
    lastBossFire = Date.now();
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
    // Faster fire rate each wave, with a floor to keep it sane.
    const bossFireInterval = Math.max(650, BOSS_FIRE_RATE - (gameState.wave - 1) * 30);
    if (now - lastBossFire > bossFireInterval) {
      ensureCapacity(gameState.projectiles, MAX_PROJECTILES, 2);

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
      ensureCapacity(gameState.projectiles, MAX_PROJECTILES, 1);
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
      ensureCapacity(gameState.enemies, MAX_ENEMIES, 1);
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
      ensureCapacity(gameState.bonuses, MAX_BONUSES, 1);
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
        ensureCapacity(gameState.projectiles, MAX_PROJECTILES, 1);
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

const WebSocket = require('ws');
const http = require('http');

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
const TICK_RATE = 1000 / 60; // 60 FPS

// Boss phase constants
const BOSS_PHASE_INTERVAL = 25000; // 25 seconds
const BOSS_HEALTH = 1000;
const BOSS_SPEED = 3;
const BOSS_FIRE_RATE = 1200;

// Hard caps to prevent runaway CPU/memory
const MAX_ENEMIES = 25;
const MAX_PROJECTILES = 200;
const MAX_BONUSES = 8;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Game Server Running');
});

const wss = new WebSocket.Server({ server });

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function ensureCapacity(arr, max, extra = 1) {
  const overflow = arr.length + extra - max;
  if (overflow > 0) arr.splice(0, overflow);
}

wss.on('connection', (ws) => {
  console.log('Client connected to game server');

  let gameState = {
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

  let currentInput = {
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
  let gameLoopInterval = null;

  function spawnBoss() {
    gameState.boss = {
      id: generateId(),
      x: GAME_WIDTH / 2,
      y: 80,
      health: BOSS_HEALTH,
      maxHealth: BOSS_HEALTH,
      direction: 1,
      speed: BOSS_SPEED
    };
    gameState.bossPhase = true;
    gameState.enemies = [];
    lastBossFire = Date.now();
    console.log("Boss spawned!");
  }

  function updateBoss(now) {
    const boss = gameState.boss;
    if (!boss) return;

    // Move boss side to side
    boss.x += boss.speed * boss.direction;

    if (boss.x >= GAME_WIDTH - 60) {
      boss.direction = -1;
    } else if (boss.x <= 60) {
      boss.direction = 1;
    }

    // Boss fires
    const bossFireInterval = Math.max(650, BOSS_FIRE_RATE - (gameState.wave - 1) * 30);
    if (now - lastBossFire > bossFireInterval) {
      ensureCapacity(gameState.projectiles, MAX_PROJECTILES, 2);

      // Left cannon
      gameState.projectiles.push({
        id: generateId(),
        x: boss.x - 20,
        y: boss.y + 40,
        velocityX: 0,
        velocityY: ENEMY_PROJECTILE_SPEED,
        isEnemy: true,
      });

      // Right cannon
      gameState.projectiles.push({
        id: generateId(),
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
          gameState.score += 1000;
          gameState.boss = null;
          gameState.bossPhase = false;
          phaseStartTime = now;
          console.log("Boss defeated!");
          return;
        }
      }
    }
  }

  function updateGameState() {
    const now = Date.now();

    // Check for boss phase transitions
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

    // Update player position based on input
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
        id: generateId(),
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
    const spawnIntensity = Math.min(1.5, gameState.intensity);
    const currentSpawnInterval = ENEMY_SPAWN_INTERVAL / spawnIntensity;

    if (!gameState.bossPhase && now - lastEnemySpawn > currentSpawnInterval && gameState.enemies.length < MAX_ENEMIES) {
      gameState.enemies.push({
        id: generateId(),
        x: Math.random() * (GAME_WIDTH - 40) + 20,
        y: -20,
        health: 100,
        speed: 1 + Math.min(gameState.wave * 0.15, 2)
      });
      lastEnemySpawn = now;
    }

    // Spawn bonuses
    if (now - lastBonusSpawn > BONUS_SPAWN_INTERVAL) {
      const bonusType = Math.random() > 0.5 ? 'shield' : 'health';
      ensureCapacity(gameState.bonuses, MAX_BONUSES, 1);
      gameState.bonuses.push({
        id: generateId(),
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

    // Update projectiles
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

      // Enemy fires
      if (enemy.y > 0 && enemy.y < GAME_HEIGHT - 100 && Math.random() < ENEMY_FIRE_CHANCE) {
        ensureCapacity(gameState.projectiles, MAX_PROJECTILES, 1);
        gameState.projectiles.push({
          id: generateId(),
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

    // Check projectile-enemy collisions
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

    // Increase intensity based on score
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

    console.log('Server load simulation completed:', result);
  }

  // Start game loop
  gameLoopInterval = setInterval(() => {
    if (!gameState.gameOver) {
      updateGameState();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'state', data: gameState }));
      }
    }
  }, TICK_RATE);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'input') {
        currentInput = data.data;
      } else if (data.type === 'resume') {
        const p = data.data;
        if (typeof p?.score === 'number' && p.score > 0 && gameState.score === 0) {
          gameState.score = Math.floor(p.score);
          if (typeof p.wave === 'number') {
            gameState.wave = Math.max(1, Math.floor(p.wave));
          }
          if (typeof p.intensity === 'number') {
            gameState.intensity = Math.max(1, Math.min(3, p.intensity));
          }
          phaseStartTime = Date.now();
          console.log('Resumed progress from client', {
            score: gameState.score,
            wave: gameState.wave,
            intensity: gameState.intensity,
          });
        }
      } else if (data.type === 'restart') {
        restartGame();
      } else if (data.type === 'serverLoad') {
        simulateServerLoad();
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (gameLoopInterval) {
      clearInterval(gameLoopInterval);
    }
  });
});

const PORT = process.env.GAME_SERVER_PORT || 9999;
server.listen(PORT, () => {
  console.log(`Game server listening on port ${PORT}`);
});

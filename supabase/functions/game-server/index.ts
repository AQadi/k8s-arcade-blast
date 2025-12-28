import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface Bonus {
  id: string;
  x: number;
  y: number;
  type: 'shield' | 'health';
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
    velocityY: number;
    isEnemy: boolean;
  }>;
  bonuses: Bonus[];
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
const BONUS_SPAWN_INTERVAL = 8000; // Spawn bonus every 8 seconds
const BONUS_SPEED = 2;
const SHIELD_DURATION = 10000; // 10 seconds
const ENEMY_FIRE_CHANCE = 0.01; // 1% chance per frame per enemy
const TICK_RATE = 1000 / 60; // 60 FPS

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
  let gameLoopInterval: number | null = null;

  socket.onopen = () => {
    console.log("Client connected to game server");
    
    // Start game loop
    gameLoopInterval = setInterval(() => {
      if (!gameState.gameOver) {
        updateGameState();
      }
      // Always send state so client receives gameOver state
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
        // Simulate server load when spacebar is pressed
        simulateServerLoad();
      } else if (message.type === "ping") {
        // Respond to keepalive ping
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

  function updateGameState() {
    const now = Date.now();

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
      gameState.projectiles.push({
        id: crypto.randomUUID(),
        x: gameState.player.x,
        y: gameState.player.y - 20,
        velocityY: -PROJECTILE_SPEED,
        isEnemy: false
      });
      lastShootTime = now;
    }

    // Spawn enemies
    if (now - lastEnemySpawn > ENEMY_SPAWN_INTERVAL / gameState.intensity) {
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

    // Update bonuses and check collection
    gameState.bonuses = gameState.bonuses.filter(bonus => {
      bonus.y += bonus.speed;
      
      // Check collision with player
      const distToPlayer = Math.hypot(
        bonus.x - gameState.player.x,
        bonus.y - gameState.player.y
      );
      
      if (distToPlayer < 35) {
        // Collected!
        if (bonus.type === 'shield') {
          gameState.player.shieldActive = true;
          gameState.player.shieldEndTime = now + SHIELD_DURATION;
        } else if (bonus.type === 'health') {
          gameState.player.health = Math.min(100, gameState.player.health + 15);
        }
        return false; // Remove bonus
      }
      
      return bonus.y < GAME_HEIGHT + 20;
    });

    // Update projectiles
    gameState.projectiles = gameState.projectiles.filter(proj => {
      proj.y += proj.velocityY;
      
      // Check enemy projectile collision with player (only if shield is NOT active)
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
          return false; // Remove projectile
        }
      } else if (proj.isEnemy && gameState.player.shieldActive) {
        // Shield blocks enemy projectiles
        const distToPlayer = Math.hypot(
          proj.x - gameState.player.x,
          proj.y - gameState.player.y
        );
        if (distToPlayer < 35) {
          return false; // Projectile blocked by shield
        }
      }
      
      return proj.y > -20 && proj.y < GAME_HEIGHT + 20;
    });

    // Update enemies and make them fire
    gameState.enemies = gameState.enemies.filter(enemy => {
      enemy.y += enemy.speed;
      
      // Enemy fires at player with random chance
      if (enemy.y > 0 && enemy.y < GAME_HEIGHT - 100 && Math.random() < ENEMY_FIRE_CHANCE) {
        gameState.projectiles.push({
          id: crypto.randomUUID(),
          x: enemy.x,
          y: enemy.y + 20,
          velocityY: ENEMY_PROJECTILE_SPEED,
          isEnemy: true
        });
      }
      
      // Check collision with player (collision still happens even with shield)
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

    // Check player projectile-enemy collisions (only player projectiles damage enemies)
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      
      // Skip enemy projectiles - they don't damage enemies
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
      score: 0,
      wave: 1,
      gameOver: false,
      intensity: 1
    };
    lastShootTime = 0;
    lastEnemySpawn = 0;
    lastBonusSpawn = 0;
  }

  function simulateServerLoad() {
    // CPU-intensive calculation to generate server load
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

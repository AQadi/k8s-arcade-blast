const WebSocket = require('ws');
const http = require('http');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const PROJECTILE_SPEED = 8;
const ENEMY_SPAWN_INTERVAL = 2000;
const TICK_RATE = 1000 / 60; // 60 FPS

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Game Server Running');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to game server');
  
  let gameState = {
    player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100, health: 100 },
    enemies: [],
    projectiles: [],
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
  let gameLoopInterval = null;

  function updateGameState() {
    const now = Date.now();

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
        id: Math.random().toString(36).substr(2, 9),
        x: gameState.player.x,
        y: gameState.player.y - 20,
        velocityY: -PROJECTILE_SPEED
      });
      lastShootTime = now;
    }

    // Spawn enemies
    if (now - lastEnemySpawn > ENEMY_SPAWN_INTERVAL / gameState.intensity) {
      gameState.enemies.push({
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * (GAME_WIDTH - 40) + 20,
        y: -20,
        health: 100,
        speed: 1 + (gameState.wave * 0.2)
      });
      lastEnemySpawn = now;
    }

    // Update projectiles
    gameState.projectiles = gameState.projectiles.filter(proj => {
      proj.y += proj.velocityY;
      return proj.y > -20;
    });

    // Update enemies
    gameState.enemies = gameState.enemies.filter(enemy => {
      enemy.y += enemy.speed;
      
      // Check collision with player
      const distToPlayer = Math.hypot(
        enemy.x - gameState.player.x,
        enemy.y - gameState.player.y
      );
      
      if (distToPlayer < 40) {
        gameState.player.health -= 10;
        if (gameState.player.health <= 0) {
          gameState.gameOver = true;
        }
        return false;
      }
      
      return enemy.y < GAME_HEIGHT + 20;
    });

    // Check projectile-enemy collisions
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      
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
      player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100, health: 100 },
      enemies: [],
      projectiles: [],
      score: 0,
      wave: 1,
      gameOver: false,
      intensity: 1
    };
    lastShootTime = 0;
    lastEnemySpawn = 0;
  }

  function simulateServerLoad() {
    // CPU-intensive calculation to generate server load
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

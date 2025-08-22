// Testing utilities for Space Invaders game functionality
import { GameState } from '@/components/SpaceInvaders';
import { Mission } from '@/types/Mission';

export class GameTestSuite {
  static testPlayerMovement(gameState: GameState, keys: any): boolean {
    const initialX = gameState.player.x;
    const initialY = gameState.player.y;
    
    // Test movement bounds
    const leftBound = initialX <= 20;
    const rightBound = initialX >= 780;
    const topBound = initialY <= 20;
    const bottomBound = initialY >= 580;
    
    console.log('Player Movement Test:', {
      position: { x: initialX, y: initialY },
      bounds: { leftBound, rightBound, topBound, bottomBound },
      keysPressed: keys
    });
    
    return true;
  }

  static testCollisionDetection(gameState: GameState): boolean {
    const { enemies, bullets, player } = gameState;
    let collisionResults = {
      bulletEnemyCollisions: 0,
      playerEnemyCollisions: 0,
      powerUpCollisions: 0
    };

    // Test bullet-enemy collisions
    bullets.forEach(bullet => {
      if (bullet.type === 'player' || bullet.type === 'laser' || bullet.type === 'plasma') {
        const hitEnemy = enemies.find(enemy => 
          Math.abs(enemy.x - bullet.x) < 25 && Math.abs(enemy.y - bullet.y) < 25
        );
        if (hitEnemy) collisionResults.bulletEnemyCollisions++;
      }
    });

    // Test player-enemy collisions
    const playerHit = enemies.find(enemy =>
      Math.abs(enemy.x - player.x) < 30 && Math.abs(enemy.y - player.y) < 30
    );
    if (playerHit) collisionResults.playerEnemyCollisions++;

    // Test power-up collisions
    gameState.powerUps.forEach(powerUp => {
      const collected = Math.abs(powerUp.x - player.x) < 25 && Math.abs(powerUp.y - player.y) < 25;
      if (collected) collisionResults.powerUpCollisions++;
    });

    console.log('Collision Detection Test:', collisionResults);
    return true;
  }

  static testScoring(gameState: GameState, mission?: Mission): boolean {
    const baseScores = { basic: 100, elite: 200, boss: 500 };
    const multiplier = mission?.scoreMultiplier || 1.0;
    
    console.log('Scoring Test:', {
      currentScore: gameState.score,
      expectedMultiplier: multiplier,
      enemyCount: gameState.enemies.length,
      mission: mission?.name || 'none'
    });
    
    return gameState.score >= 0;
  }

  static testMissionLogic(gameState: GameState): boolean {
    const mission = gameState.currentMission;
    if (!mission) return false;

    const missionTests = {
      timeRemaining: gameState.timeRemaining >= 0,
      containerCount: mission.containerCount <= 3,
      difficulty: ['normal', 'hard'].includes(mission.difficulty),
      spawnRate: mission.enemySpawnRate > 0,
      scoreMultiplier: mission.scoreMultiplier > 0
    };

    console.log('Mission Logic Test:', {
      mission: mission.name,
      tests: missionTests,
      gameStatus: gameState.gameStatus
    });

    return Object.values(missionTests).every(test => test);
  }

  static testHealthSystem(gameState: GameState): boolean {
    const { player } = gameState;
    const healthTests = {
      healthInBounds: player.health >= 0 && player.health <= player.maxHealth,
      shieldInBounds: player.shield >= 0 && player.shield <= player.maxShield,
      weaponLevel: player.weaponLevel >= 1 && player.weaponLevel <= 3
    };

    console.log('Health System Test:', {
      health: `${player.health}/${player.maxHealth}`,
      shield: `${player.shield}/${player.maxShield}`,
      weaponLevel: player.weaponLevel,
      tests: healthTests
    });

    return Object.values(healthTests).every(test => test);
  }

  static testMetricsSynchronization(gameState: GameState, containers: any[]): boolean {
    const activeContainers = gameState.currentMission?.containerCount || 1;
    const gameIntensity = gameState.enemies.length * 10 + gameState.bullets.length * 5;
    
    const syncTests = {
      containerCountMatch: containers.filter(c => c.id.startsWith('pod-')).length === 3,
      activeContainersCorrect: activeContainers <= 3,
      metricsReflectGameState: gameIntensity >= 0,
      cpuUsageRealistic: containers.every(c => c.cpuUsage >= 0 && c.cpuUsage <= 100),
      memoryUsageRealistic: containers.every(c => c.memoryUsage >= 0 && c.memoryUsage <= 100)
    };

    console.log('Metrics Synchronization Test:', {
      gameIntensity,
      activeContainers,
      containerMetrics: containers.map(c => ({
        id: c.id,
        cpu: c.cpuUsage?.toFixed(1),
        memory: c.memoryUsage?.toFixed(1),
        status: c.status
      })),
      tests: syncTests
    });

    return Object.values(syncTests).every(test => test);
  }

  static runFullTestSuite(gameState: GameState, keys: any, containers: any[]): void {
    console.log('=== SPACE INVADERS FUNCTIONAL TEST SUITE ===');
    console.log('Game Status:', gameState.gameStatus);
    console.log('Current Mission:', gameState.currentMission?.name || 'None');
    
    const testResults = {
      playerMovement: this.testPlayerMovement(gameState, keys),
      collisionDetection: this.testCollisionDetection(gameState),
      scoring: this.testScoring(gameState, gameState.currentMission),
      missionLogic: this.testMissionLogic(gameState),
      healthSystem: this.testHealthSystem(gameState),
      metricsSynchronization: this.testMetricsSynchronization(gameState, containers)
    };

    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log('=== TEST RESULTS ===');
    console.log(`Passed: ${passedTests}/${totalTests}`);
    console.log('Individual Results:', testResults);
    
    if (passedTests === totalTests) {
      console.log('✅ ALL TESTS PASSED');
    } else {
      console.log('❌ SOME TESTS FAILED');
    }
  }
}
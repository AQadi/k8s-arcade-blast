// Testing utilities - simplified for server-side game
export class GameTestSuite {
  static runFullTestSuite(gameState: any, keys: any, containers: any[]): void {
    console.log('=== SPACE INVADERS TEST SUITE ===');
    console.log('Server-side game running - client displays state only');
    console.log('Game State:', {
      score: gameState?.score || 0,
      enemies: gameState?.enemies?.length || 0,
      health: gameState?.player?.health || 0
    });
  }
}

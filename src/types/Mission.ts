export interface Mission {
  id: string;
  name: string;
  description: string;
  containerCount: number;
  difficulty: 'normal' | 'hard';
  objectives: string[];
  enemySpawnRate: number;
  duration: number;
  scoreMultiplier: number;
}
import { Mission } from '@/types/Mission';

export const MISSIONS: Mission[] = [
  {
    id: 'single-container',
    name: 'RECONNAISSANCE',
    description: 'Single-node deployment mission. Perfect for testing basic container orchestration.',
    containerCount: 1,
    difficulty: 'normal',
    objectives: [
      'Survive 1 minute',
      'Destroy 25 enemies',
      'Maintain hull integrity above 50%'
    ],
    enemySpawnRate: 60, // Every 60 frames
    duration: 60, // 1 minute
    scoreMultiplier: 1.0
  },
  {
    id: 'multi-container',
    name: 'ASSAULT PROTOCOL',
    description: 'Triple-node distributed deployment. Demonstrates advanced horizontal scaling and load balancing.',
    containerCount: 3,
    difficulty: 'hard',
    objectives: [
      'Survive 1 minute of intense combat',
      'Destroy 50 enemies',
      'Handle high-frequency enemy waves',
      'Test distributed processing limits'
    ],
    enemySpawnRate: 25, // Every 25 frames (faster than 2-container)
    duration: 60, // 1 minute
    scoreMultiplier: 3.0
  }
];

export const getMissionById = (id: string): Mission | undefined => {
  return MISSIONS.find(mission => mission.id === id);
};
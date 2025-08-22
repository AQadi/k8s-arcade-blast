import { Mission } from '@/types/Mission';

export const MISSIONS: Mission[] = [
  {
    id: 'single-container',
    name: 'RECONNAISSANCE',
    description: 'Single-node deployment mission. Perfect for testing basic container orchestration.',
    containerCount: 1,
    difficulty: 'normal',
    objectives: [
      'Survive 2 minutes',
      'Destroy 50 enemies',
      'Maintain hull integrity above 50%'
    ],
    enemySpawnRate: 60, // Every 60 frames
    duration: 120, // 2 minutes
    scoreMultiplier: 1.0
  },
  {
    id: 'multi-container',
    name: 'ASSAULT PROTOCOL',
    description: 'Multi-node distributed deployment. Demonstrates horizontal scaling and load balancing.',
    containerCount: 2,
    difficulty: 'hard',
    objectives: [
      'Survive 2 minutes of intense combat',
      'Destroy 100 enemies',
      'Handle high-frequency enemy waves',
      'Test distributed processing limits'
    ],
    enemySpawnRate: 30, // Every 30 frames (2x faster)
    duration: 120, // 2 minutes
    scoreMultiplier: 2.0
  }
];

export const getMissionById = (id: string): Mission | undefined => {
  return MISSIONS.find(mission => mission.id === id);
};
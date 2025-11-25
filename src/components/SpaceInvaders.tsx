import { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameHUD } from './GameHUD';
import { GameOverScreen } from './GameOverScreen';
import { MetricsDashboard } from './MetricsDashboard';
import { useKeyboard } from '@/hooks/useKeyboard';

interface ServerGameState {
  player: {
    x: number;
    y: number;
    health: number;
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
  }>;
  score: number;
  wave: number;
  gameOver: boolean;
  intensity: number;
}

export const SpaceInvaders = () => {
  const [serverGameState, setServerGameState] = useState<ServerGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const keys = useKeyboard();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  const connectToServer = () => {
    console.log('Attempting to connect to local game server...');

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    // Connect to local WebSocket game server
    const wsUrl = import.meta.env.VITE_GAME_SERVER_URL || 'ws://localhost:9999';
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log('Connected to game server');
      setConnected(true);

      // Send keepalive ping every 30 seconds to prevent cold start
      const keepAliveInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'ping',
          }));
        } else {
          clearInterval(keepAliveInterval);
        }
      }, 30000);
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'state') {
          const now = performance.now();
          // Throttle React updates to ~20 FPS to reduce flickering
          if (now - lastFrameTimeRef.current > 50) {
            lastFrameTimeRef.current = now;
            setServerGameState(message.data);
          }
        }
      } catch (error) {
        console.error('Error parsing server message:', error);
      }
    };
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    ws.onclose = (event) => {
      console.log('Disconnected from game server, code:', event.code);
      setConnected(false);

      // Only auto-reconnect if it wasn't a clean close
      if (event.code !== 1000) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectToServer();
        }, 5000); // Increased to 5 seconds
      }
    };
    wsRef.current = ws;
  };
  useEffect(() => {
    console.log('SpaceInvaders component mounted - connecting to server');
    connectToServer();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Send input state to server
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input',
        data: {
          left: keys.ArrowLeft || keys.a,
          right: keys.ArrowRight || keys.d,
          up: keys.ArrowUp || keys.w,
          down: keys.ArrowDown || keys.s,
          shoot: keys[' '] || keys.Enter,
        },
      }));
    }
  }, [keys]);

  // Handle spacebar for server load
  useEffect(() => {
    const isShootPressed = keys[' '] || keys.Enter;
    if (isShootPressed && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'serverLoad',
      }));
    }
  }, [keys[' '], keys.Enter]);

  // Auto-restart when game over
  useEffect(() => {
    if (serverGameState?.gameOver && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const timer = setTimeout(() => {
        wsRef.current?.send(JSON.stringify({
          type: 'restart',
        }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [serverGameState?.gameOver]);

  const restartGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'restart',
      }));
    }
  };

  // Only show the connecting screen until we receive the first game state.
  // After that, keep rendering the last known frame even if the socket reconnects,
  // to avoid the whole screen flickering on transient disconnects.
  if (!serverGameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center pt-8">
        <div className="text-white text-2xl animate-pulse">
          {connected ? 'Loading game state...' : 'Connecting to game server...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {!serverGameState.gameOver ? (
        <div className="flex flex-col h-screen">
          <GameHUD
            score={serverGameState.score}
            wave={serverGameState.wave}
            health={serverGameState.player.health}
          />
          <div className="flex flex-1">
            <div className="flex-1 flex items-center justify-center p-8">
              <GameCanvas
                playerX={serverGameState.player.x}
                playerY={serverGameState.player.y}
                enemies={serverGameState.enemies}
                projectiles={serverGameState.projectiles}
              />
            </div>
            {/* Metrics dashboard will be shown on the right side when implemented */}
          </div>
        </div>
      ) : (
        <GameOverScreen score={serverGameState.score} onRestart={restartGame} />
      )}
    </div>
  );
};

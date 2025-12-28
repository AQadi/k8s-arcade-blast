import { useState, useEffect, useRef, useMemo } from 'react';
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
    isEnemy?: boolean;
  }>;
  bonuses: Array<{
    id: string;
    x: number;
    y: number;
    type: 'shield' | 'health';
  }>;
  boss: {
    id: string;
    x: number;
    y: number;
    health: number;
    maxHealth: number;
  } | null;
  bossPhase: boolean;
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
  const keepAliveIntervalRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  // Prevent "score reset to 0" after transient disconnects by resuming progress.
  const lastProgressRef = useRef<{ score: number; wave: number; intensity: number } | null>(null);

  const connectToServer = () => {
    console.log('Attempting to connect to local game server...');

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    // Use backend websocket function in preview.
    const wsUrl = `wss://goqwapsbayjbobxvibid.functions.supabase.co/functions/v1/game-server`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log('Connected to game server');
      setConnected(true);

      // Resume last known progress after reconnect (prevents score reset).
      if (lastProgressRef.current?.score && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'resume', data: lastProgressRef.current }));
        } catch {
          // ignore
        }
      }

      // Send keepalive ping every 30 seconds
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      keepAliveIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
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

            // Persist last known progress for reconnect resume.
            if (typeof message.data?.score === 'number') {
              lastProgressRef.current = {
                score: message.data.score,
                wave: message.data.wave,
                intensity: message.data.intensity,
              };
            }
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

      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = undefined;
      }

      // Only auto-reconnect if it wasn't a clean close
      if (event.code !== 1000) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectToServer();
        }, 5000);
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
            shieldActive={serverGameState.player.shieldActive}
            shieldTimeRemaining={serverGameState.player.shieldActive 
              ? Math.max(0, (serverGameState.player.shieldEndTime - Date.now()) / 1000) 
              : 0
            }
          />
          <div className="flex flex-1">
            <div className="flex-1 flex items-start justify-center p-8">
              <GameCanvas
                playerX={serverGameState.player.x}
                playerY={serverGameState.player.y}
                enemies={serverGameState.enemies}
                projectiles={serverGameState.projectiles}
                bonuses={serverGameState.bonuses}
                boss={serverGameState.boss}
                bossPhase={serverGameState.bossPhase}
                shieldActive={serverGameState.player.shieldActive}
                isMovingUp={Boolean(keys.ArrowUp || keys.w)}
                isMovingLeft={Boolean(keys.ArrowLeft || keys.a)}
                isMovingRight={Boolean(keys.ArrowRight || keys.d)}
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

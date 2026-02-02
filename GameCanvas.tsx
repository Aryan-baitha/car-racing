import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameMode, PlayerProfile, RaceResult, CARS } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, PLAYER_Y_OFFSET, BASE_SPEED, MAX_SPEED, TRAFFIC_SPAWN_RATE, COIN_VALUE, SCORE_PER_METER } from '../constants';
import { AudioService } from '../services/audioService';
import { saveScoreToLeaderboard } from '../services/storageService';

interface GameCanvasProps {
  mode: GameMode;
  profile: PlayerProfile;
  onRaceFinished: (result: RaceResult) => void;
  onExit: () => void;
}

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'player' | 'enemy' | 'coin';
  speed: number;
  lane?: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ mode, profile, onRaceFinished, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  
  // Game State Refs (to avoid closures in animation loop)
  const gameState = useRef({
    playerX: CANVAS_WIDTH / 2 - 25, // Center
    targetLane: 2, // 0-4
    lanes: [
        CANVAS_WIDTH/2 - LANE_WIDTH*2, 
        CANVAS_WIDTH/2 - LANE_WIDTH, 
        CANVAS_WIDTH/2, 
        CANVAS_WIDTH/2 + LANE_WIDTH,
        CANVAS_WIDTH/2 + LANE_WIDTH*2
    ], // X positions of lanes
    speed: 0,
    distance: 0,
    score: 0,
    coins: 0,
    enemies: [] as Entity[],
    coinsEntities: [] as Entity[],
    lastTime: 0,
    lastSpawn: 0,
    isGameOver: false,
    roadOffset: 0
  });

  // Controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState.current.isGameOver) return;
    if (e.key === 'Escape') {
      setPaused(prev => !prev);
    }
    
    // Lane changing
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      if (gameState.current.targetLane > 0) {
        gameState.current.targetLane--;
      }
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      if (gameState.current.targetLane < 4) {
        gameState.current.targetLane++;
      }
    }
  }, []);

  // Touch controls for mobile
  const handleTouch = (direction: 'left' | 'right') => {
    if (gameState.current.isGameOver || paused) return;
    if (direction === 'left' && gameState.current.targetLane > 0) gameState.current.targetLane--;
    if (direction === 'right' && gameState.current.targetLane < 4) gameState.current.targetLane++;
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Initial Setup
  useEffect(() => {
    // Determine player car stats
    const carStats = CARS.find(c => c.id === profile.equippedCarId) || CARS[0];
    const maxSpeed = mode === GameMode.MULTIPLAYER ? MAX_SPEED * 1.2 : MAX_SPEED; // Faster in MP
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Reset State
    gameState.current = {
      ...gameState.current,
      speed: 0,
      score: 0,
      distance: 0,
      coins: 0,
      enemies: [],
      coinsEntities: [],
      isGameOver: false,
      targetLane: 2,
      playerX: gameState.current.lanes[2]
    };
    
    AudioService.playSound('start');

    const render = (time: number) => {
      if (paused) {
         animationFrameId = requestAnimationFrame(render);
         return;
      }

      const state = gameState.current;
      if (!state.lastTime) state.lastTime = time;
      const deltaTime = time - state.lastTime;
      state.lastTime = time;

      if (state.isGameOver) return;

      // 1. Update Physics
      
      // Accelerate
      if (state.speed < maxSpeed) {
        state.speed += (carStats.acceleration / 100) * 0.1;
      }
      
      // Move player x towards target lane (Smooth lerp)
      const targetX = state.lanes[state.targetLane];
      state.playerX += (targetX - state.playerX) * (carStats.handling / 100) * 0.2;

      // Update distance & Score
      const moveAmount = state.speed * (deltaTime / 16); // Normalize to ~60fps
      state.distance += moveAmount;
      state.score += (moveAmount * SCORE_PER_METER) / 10;
      state.roadOffset = (state.roadOffset + moveAmount) % 80;

      // Spawn Enemies
      if (time - state.lastSpawn > Math.max(400, TRAFFIC_SPAWN_RATE - (state.distance/100))) {
        state.lastSpawn = time;
        const lane = Math.floor(Math.random() * 5);
        // Don't spawn on top of player if distance is low
        
        // Randomly spawn coin or enemy
        if (Math.random() > 0.8) {
             state.coinsEntities.push({
                x: state.lanes[lane],
                y: -100,
                width: 40,
                height: 40,
                color: '#fbbf24', // Gold
                type: 'coin',
                speed: 0
            });
        } else {
            state.enemies.push({
                x: state.lanes[lane],
                y: -150,
                width: 50,
                height: 90,
                color: Math.random() > 0.5 ? '#ef4444' : '#ffffff',
                type: 'enemy',
                speed: state.speed * 0.5 + Math.random() * 2 // Traffic moves slower than player
            });
        }
      }

      // Move Enemies & Coins
      // Objects move DOWN screen relative to player speed difference
      // relativeSpeed = playerSpeed - objectSpeed. 
      // If player is faster, objects move down (positive Y).
      
      state.enemies.forEach(entity => {
         entity.y += (state.speed - entity.speed) * (deltaTime / 16);
      });
      
      state.coinsEntities.forEach(entity => {
         entity.y += state.speed * (deltaTime / 16); // Coins are stationary
      });

      // Cleanup off-screen
      state.enemies = state.enemies.filter(e => e.y < CANVAS_HEIGHT + 100);
      state.coinsEntities = state.coinsEntities.filter(e => e.y < CANVAS_HEIGHT + 100);

      // Collision Detection
      const playerRect = { x: state.playerX - 25, y: PLAYER_Y_OFFSET, width: 50, height: 90 };
      
      // Check Coins
      for (let i = state.coinsEntities.length - 1; i >= 0; i--) {
          const coin = state.coinsEntities[i];
          if (
              playerRect.x < coin.x + coin.width/2 + 20 &&
              playerRect.x + playerRect.width > coin.x - 20 &&
              playerRect.y < coin.y + coin.height &&
              playerRect.y + playerRect.height > coin.y
          ) {
              // Collected
              state.coinsEntities.splice(i, 1);
              state.coins += COIN_VALUE;
              state.score += 50;
              AudioService.playSound('coin');
          }
      }

      // Check Enemies
      for (const enemy of state.enemies) {
          // Simple AABB with slightly reduced hitbox for leniency
           if (
              playerRect.x < enemy.x + 20 && // Enemy is center point based in render, but let's assume x is center
              playerRect.x + playerRect.width > enemy.x - 20 &&
              playerRect.y < enemy.y + enemy.height &&
              playerRect.y + playerRect.height > enemy.y
          ) {
              // Crash!
              state.isGameOver = true;
              AudioService.playSound('crash');
              setGameOver(true);
              
              saveScoreToLeaderboard(profile.username, Math.floor(state.score));
          }
      }


      // 2. Render
      // Background
      ctx.fillStyle = '#1e293b'; // Road Color
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Lane Markers
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.setLineDash([40, 40]);
      ctx.lineDashOffset = -state.roadOffset;
      
      state.lanes.forEach((laneX, i) => {
          if (i === 0) return; // Skip first left border
          // Draw dividing lines
          const lineX = (state.lanes[i-1] + laneX) / 2 + (LANE_WIDTH/2); // Between lanes
          if (i <= 4) { // Don't draw after last lane
             ctx.beginPath();
             ctx.moveTo(lineX, -50);
             ctx.lineTo(lineX, CANVAS_HEIGHT + 50);
             ctx.stroke();
          }
      });
      
      // Reset Dash
      ctx.setLineDash([]);

      // Draw Coins
      state.coinsEntities.forEach(coin => {
          ctx.fillStyle = coin.color;
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'gold';
          ctx.fill();
          ctx.shadowBlur = 0;
      });

      // Draw Enemies
      state.enemies.forEach(enemy => {
          ctx.fillStyle = enemy.color;
          // Simple Car Shape
          ctx.fillRect(enemy.x - 22, enemy.y, 44, 80);
          // Lights
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(enemy.x - 20, enemy.y + 75, 10, 5);
          ctx.fillRect(enemy.x + 10, enemy.y + 75, 10, 5);
      });

      // Draw Player
      ctx.fillStyle = carStats.color;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(state.playerX - 22, PLAYER_Y_OFFSET + 10, 50, 90);
      
      // Car Body
      ctx.fillStyle = carStats.color;
      ctx.fillRect(state.playerX - 25, PLAYER_Y_OFFSET, 50, 90);
      
      // Windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(state.playerX - 20, PLAYER_Y_OFFSET + 20, 40, 20);
      
      // Headlights (Beams)
      ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
      ctx.beginPath();
      ctx.moveTo(state.playerX - 20, PLAYER_Y_OFFSET);
      ctx.lineTo(state.playerX - 60, PLAYER_Y_OFFSET - 200);
      ctx.lineTo(state.playerX + 60, PLAYER_Y_OFFSET - 200);
      ctx.lineTo(state.playerX + 20, PLAYER_Y_OFFSET);
      ctx.fill();


      // 3. Update React UI State (throttled)
      if (Math.floor(time) % 10 === 0) {
        setScore(Math.floor(state.score));
        setSpeed(Math.floor(state.speed * 10));
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [paused, mode, profile.equippedCarId, profile.username]); // Re-run if paused changes

  const finishRace = () => {
    onRaceFinished({
        score: Math.floor(gameState.current.score),
        distance: Math.floor(gameState.current.distance),
        coinsEarned: gameState.current.coins + Math.floor(gameState.current.score / 100),
        xpEarned: Math.floor(gameState.current.distance / 10)
    });
  };

  return (
    <div className="relative w-full h-full bg-slate-900 flex justify-center items-center overflow-hidden">
      {/* Canvas Container that maintains aspect ratio or fills mobile */}
      <div className="relative w-full h-full max-w-lg aspect-[9/16] bg-slate-800 shadow-2xl overflow-hidden border-x border-slate-700">
        <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            className="w-full h-full object-cover block"
        />

        {/* HUD - Added pointer-events-none to container so it doesn't block touches below, but re-enabled for button */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none">
            <div className="pointer-events-auto">
                <div className="text-xs text-slate-400 uppercase tracking-widest">Score</div>
                <div className="text-3xl font-display font-bold text-white tabular-nums">{score.toLocaleString()}</div>
            </div>
            
             {/* Pause Button */}
             <button 
                onClick={() => setPaused(true)} 
                className="pointer-events-auto p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors active:scale-95 mx-2"
                aria-label="Pause"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
            </button>

            <div className="text-right pointer-events-auto">
                <div className="text-xs text-slate-400 uppercase tracking-widest">Speed</div>
                <div className="text-3xl font-display font-bold text-blue-400 tabular-nums">{speed} <span className="text-sm">KM/H</span></div>
            </div>
        </div>
        
        {/* Controls Overlay (Mobile) */}
        <div className="absolute inset-0 flex z-10">
            <div className="w-1/2 h-full active:bg-white/5 transition-colors" onTouchStart={() => handleTouch('left')}></div>
            <div className="w-1/2 h-full active:bg-white/5 transition-colors" onTouchStart={() => handleTouch('right')}></div>
        </div>

        {/* Pause Menu */}
        {paused && !gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="text-center space-y-4 animate-fadeIn">
                    <h2 className="text-4xl font-display font-bold text-white">PAUSED</h2>
                    <button onClick={() => setPaused(false)} className="block w-full px-8 py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 shadow-lg">RESUME</button>
                    <button onClick={onExit} className="block w-full px-8 py-3 bg-red-600 rounded-lg font-bold hover:bg-red-500 shadow-lg">QUIT</button>
                </div>
            </div>
        )}

        {/* Game Over */}
        {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 animate-fadeIn">
                <h2 className="text-5xl font-display font-black text-red-500 mb-2 neon-text">CRASHED</h2>
                <p className="text-slate-300 mb-8">RACE TERMINATED</p>
                
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full mb-8">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-400">Final Score</span>
                        <span className="font-bold text-white">{Math.floor(gameState.current.score)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-400">Distance</span>
                        <span className="font-bold text-blue-400">{Math.floor(gameState.current.distance)} m</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Coins</span>
                        <span className="font-bold text-yellow-400">+{gameState.current.coins}</span>
                    </div>
                </div>

                <div className="space-y-3 w-full">
                    <button onClick={finishRace} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-blue-900/50">
                        CLAIM REWARDS
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Desktop Helper */}
      <div className="hidden lg:block absolute left-8 bottom-8 text-slate-500 text-sm">
         <p>CONTROLS</p>
         <p>[ ← / → ] to Steer</p>
         <p>[ ESC ] to Pause</p>
      </div>
    </div>
  );
};

export default GameCanvas;
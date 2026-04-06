import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../game/Player';
import { Enemy } from '../game/Enemy';
import { Mushroom } from '../game/PowerUp';
import { Coin } from '../game/Coin';
import { getTiles, getClouds, getScenery } from '../game/Level';
import { TILE } from '../game/Constants';
import { applyPhysics } from '../game/Physics';
import { collideTiles, collideEnemies, collidePowerUps } from '../game/Collision';
import { camera, updateCamera } from '../game/Camera';
import { playSound } from '../game/Sound';
import { rectIntersect } from '../game/Collision';

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [running, setRunning] = useState(false);
    
    const gameRef = useRef({
        player: new Player(),
        tiles: getTiles(),
        clouds: getClouds(),
        scenery: getScenery(),
        enemies: [
            new Enemy(22 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(40 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(50 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(52 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(80 * 32, 8 * 32, "MARGS", "#8E44AD"),
            new Enemy(96 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(110 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(130 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(170 * 32, 13 * 32, "MARGS", "#8E44AD")
        ],
        mushrooms: [] as Mushroom[],
        coins: [] as Coin[],
        keys: {} as Record<string, boolean>,
        timer: 400,
        lastTimerUpdate: Date.now(),
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            gameRef.current.keys[e.code] = true;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                if (gameRef.current.player.onGround) {
                    playSound('jump');
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => gameRef.current.keys[e.code] = false;
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        if (!running) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const reset = () => {
            gameRef.current.player.x = 100;
            gameRef.current.player.y = 400;
            gameRef.current.player.vx = 0;
            gameRef.current.player.vy = 0;
            gameRef.current.player.state = "small";
            gameRef.current.player.h = 48;
        };

        const loop = () => {
            const { player, tiles, clouds, scenery, enemies, mushrooms, coins, keys } = gameRef.current;

            // Update Player
            player.update(keys);
            applyPhysics(player);

            // Update Enemies
            enemies.forEach(e => {
                e.update();
                applyPhysics(e);
                collideTiles(e, tiles);
            });

            // Update Mushrooms
            mushrooms.forEach(m => {
                m.update();
                collideTiles(m, tiles);
            });

            // Update Coins
            coins.forEach(c => {
                c.update();
                collideTiles(c, tiles);
            });

            // Collide player with coins
            coins.forEach(c => {
                if (c.active && rectIntersect(player, c)) {
                    c.active = false;
                    playSound('coin');
                    const currentCoins = gameRef.current.keys['coins'] ? Number(gameRef.current.keys['coins']) : 0;
                    gameRef.current.keys['coins'] = (currentCoins + 1) as any;
                }
            });

            // Remove inactive coins
            gameRef.current.coins = coins.filter(c => c.active);

            // Collisions
            collidePowerUps(player, mushrooms);
            collideEnemies(player, enemies, reset);
            collideTiles(player, tiles, (t) => {
                // Spawn a coin when a block is hit
                const vx = (Math.random() - 0.5) * 4;
                const vy = -12;
                gameRef.current.coins.push(new Coin(t.x + 12, t.y - 20, vx, vy));
                
                // Spawn mushroom if it's the first question block
                if (t.type === 'question' && t.x === 16 * TILE && t.y === 9 * TILE) {
                    gameRef.current.mushrooms.push(new Mushroom(t.x, t.y - 20));
                }
            });

            // Update Timer
            const now = Date.now();
            if (now - gameRef.current.lastTimerUpdate >= 1000) {
                gameRef.current.timer -= 1;
                gameRef.current.lastTimerUpdate = now;
            }
            if (gameRef.current.timer <= 0) {
                reset();
                gameRef.current.timer = 400;
            }

            // Camera
            updateCamera(player, canvas.width);

            if (player.y > canvas.height) reset();

            // Draw
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Sky Background
            ctx.fillStyle = "#5C94FC";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Clouds
            ctx.fillStyle = "#ffffff";
            const time = Date.now() / 1000;
            const wrapWidth = 1424; // Matches generation wrap width
            clouds.forEach(c => {
                let drawX = c.x - (camera.x * c.parallaxSpeed) + (time * c.driftSpeed);
                // Wrap around logic based on drawX
                drawX = ((drawX % wrapWidth) + wrapWidth) % wrapWidth - 200;
                
                ctx.beginPath();
                for (let p of c.parts) {
                    ctx.arc(drawX + p.cx, c.y + p.cy, p.r, 0, Math.PI * 2);
                }
                ctx.fill();
            });

            // Draw Scenery
            scenery.forEach(s => {
                const drawX = s.x - camera.x;
                const drawY = s.y;
                if (s.type === 'hill') {
                    ctx.fillStyle = "#00a800";
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, 80, Math.PI, 0);
                    ctx.fill();
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, 50, Math.PI, 0);
                    ctx.stroke();
                } else if (s.type === 'bush' || s.type === 'small_bush') {
                    ctx.fillStyle = "#00a800";
                    ctx.beginPath();
                    ctx.arc(drawX - 30, drawY, 30, Math.PI, 0);
                    ctx.arc(drawX, drawY - 15, 35, Math.PI, 0);
                    ctx.arc(drawX + 30, drawY, 30, Math.PI, 0);
                    ctx.fill();
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            // Draw Tiles
            for (let t of tiles) {
                if (t.destroyed) continue;

                if (t.type === 'ground') {
                    ctx.fillStyle = "#c84c0c";
                    ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.fillStyle = "#fca044";
                    ctx.fillRect(t.x - camera.x, t.y, t.w, 4);
                } else if (t.type === 'brick') {
                    ctx.fillStyle = "#c84c0c";
                    ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.beginPath();
                    ctx.moveTo(t.x - camera.x, t.y + t.h/2);
                    ctx.lineTo(t.x - camera.x + t.w, t.y + t.h/2);
                    ctx.moveTo(t.x - camera.x + t.w/2, t.y);
                    ctx.lineTo(t.x - camera.x + t.w/2, t.y + t.h/2);
                    ctx.moveTo(t.x - camera.x + t.w/4, t.y + t.h/2);
                    ctx.lineTo(t.x - camera.x + t.w/4, t.y + t.h);
                    ctx.moveTo(t.x - camera.x + t.w*0.75, t.y + t.h/2);
                    ctx.lineTo(t.x - camera.x + t.w*0.75, t.y + t.h);
                    ctx.stroke();
                } else if (t.type === 'question') {
                    if (t.used) {
                        ctx.fillStyle = "#c84c0c";
                        ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                        ctx.strokeStyle = "#000000";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(t.x - camera.x, t.y, t.w, t.h);
                        ctx.fillStyle = "#000000";
                        ctx.fillRect(t.x - camera.x + 4, t.y + 4, 6, 6);
                    } else {
                        ctx.fillStyle = "#fca044";
                        ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                        ctx.strokeStyle = "#000000";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(t.x - camera.x, t.y, t.w, t.h);
                        // 4 corner dots
                        ctx.fillStyle = "#c84c0c";
                        ctx.fillRect(t.x - camera.x + 4, t.y + 4, 4, 4);
                        ctx.fillRect(t.x - camera.x + t.w - 8, t.y + 4, 4, 4);
                        ctx.fillRect(t.x - camera.x + 4, t.y + t.h - 8, 4, 4);
                        ctx.fillRect(t.x - camera.x + t.w - 8, t.y + t.h - 8, 4, 4);
                        // The ?
                        ctx.fillStyle = "#c84c0c";
                        ctx.font = "bold 20px monospace";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText("?", t.x - camera.x + t.w/2, t.y + t.h/2 + 2);
                    }
                } else if (t.type === 'solid') {
                    ctx.fillStyle = "#c84c0c";
                    ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.fillStyle = "#fca044";
                    ctx.fillRect(t.x - camera.x + 4, t.y + 4, 6, 6);
                } else if (t.type === 'pipe') {
                    ctx.fillStyle = "#00a800";
                    ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                    
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    if (t.isLeft) {
                        ctx.moveTo(t.x - camera.x, t.y);
                        ctx.lineTo(t.x - camera.x, t.y + t.h);
                    } else {
                        ctx.moveTo(t.x - camera.x + t.w, t.y);
                        ctx.lineTo(t.x - camera.x + t.w, t.y + t.h);
                    }
                    ctx.stroke();

                    if (t.isLeft) {
                        ctx.fillStyle = "#80d010";
                        ctx.fillRect(t.x - camera.x + 4, t.y, 4, t.h);
                        ctx.fillRect(t.x - camera.x + 12, t.y, 2, t.h);
                    }

                    if (t.isTop) {
                        ctx.fillStyle = "#00a800";
                        let capX = t.x - camera.x;
                        let capW = t.w;
                        if (t.isLeft) {
                            capX -= 4;
                            capW += 4;
                        } else {
                            capW += 4;
                        }
                        ctx.fillRect(capX, t.y, capW, 24);
                        
                        ctx.beginPath();
                        // Top edge
                        ctx.moveTo(capX, t.y);
                        ctx.lineTo(capX + capW, t.y);
                        // Bottom edge
                        ctx.moveTo(capX, t.y + 24);
                        ctx.lineTo(capX + capW, t.y + 24);
                        // Side edge
                        if (t.isLeft) {
                            ctx.moveTo(capX, t.y);
                            ctx.lineTo(capX, t.y + 24);
                        } else {
                            ctx.moveTo(capX + capW, t.y);
                            ctx.lineTo(capX + capW, t.y + 24);
                        }
                        ctx.stroke();

                        if (t.isLeft) {
                            ctx.fillStyle = "#80d010";
                            ctx.fillRect(capX + 4, t.y + 2, 4, 20);
                            ctx.fillRect(capX + 12, t.y + 2, 2, 20);
                        }
                    }
                } else if (t.type === 'flagpole') {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(t.x - camera.x + 12, t.y, 8, t.h);
                    if (t.isTop) {
                        ctx.fillStyle = "#00a800";
                        ctx.beginPath();
                        ctx.arc(t.x - camera.x + 16, t.y, 10, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(t.x - camera.x - 16, t.y + 10, 28, 20);
                    }
                } else if (t.type === 'castle') {
                    ctx.fillStyle = "#c84c0c";
                    ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(t.x - camera.x + 10, t.y + 10, 12, 4);
                } else if (t.type === 'plant') {
                    ctx.fillStyle = "#00a800";
                    ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.fillStyle = "#ff0000";
                    ctx.fillRect(t.x - camera.x + 10, t.y + 10, 20, 20);
                }
            }

            // Draw Entities
            mushrooms.forEach(m => m.draw(ctx, camera.x));
            coins.forEach(c => c.draw(ctx, camera.x));
            enemies.forEach(e => e.draw(ctx, camera.x));
            player.draw(ctx, camera.x);

            // Draw HUD
            ctx.fillStyle = "white";
            ctx.font = "bold 24px monospace";
            ctx.textAlign = "left";
            ctx.fillText("GinjaJay", 50, 50);
            const collectedCoins = gameRef.current.keys['coins'] ? Number(gameRef.current.keys['coins']) : 0;
            ctx.fillText(collectedCoins.toString().padStart(6, '0'), 50, 80);
            
            ctx.textAlign = "center";
            ctx.fillText(`🪙 x ${collectedCoins.toString().padStart(2, '0')}`, canvas.width / 2 - 100, 80);
            
            ctx.fillText("WORLD", canvas.width / 2 + 100, 50);
            ctx.fillText("1-1", canvas.width / 2 + 100, 80);
            
            ctx.textAlign = "right";
            ctx.fillText("TIME", canvas.width - 50, 50);
            ctx.fillText(gameRef.current.timer.toString().padStart(3, '0'), canvas.width - 50, 80);

            animationFrameId = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(animationFrameId);
    }, [running]);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#000]">
            {!running && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white [text-shadow:3px_3px_0_#000] z-10">
                    <h1 className="text-4xl font-bold mb-4">GINGER JAY WORLD</h1>
                    <p className="mb-6">A/D to Move | SPACE to Jump</p>
                    <button 
                        onClick={() => {
                            playSound('jump'); // Initialize audio context on user gesture
                            setRunning(true);
                        }}
                        className="px-10 py-5 text-xl bg-[#c84c0c] text-white border-4 border-white font-bold cursor-pointer hover:bg-[#a03c0a] transition-colors"
                    >
                        START ENGINE
                    </button>
                </div>
            )}
            <canvas ref={canvasRef} width={1024} height={640} className="block w-full h-full object-contain bg-[#5C94FC]" />
        </div>
    );
}

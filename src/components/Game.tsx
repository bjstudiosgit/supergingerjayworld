import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../game/Player';
import { DentistPlayer } from '../game/DentistPlayer';
import { PassivePlayer } from '../game/PassivePlayer';
import { Enemy, Bouncer } from '../game/Enemy';
import { Mushroom } from '../game/PowerUp';
import { Coin } from '../game/Coin';
import { getTiles, getClouds, getScenery, setCurrentLevel, currentLevelId, LevelId } from '../game/Level';
import { TILE } from '../game/Constants';
import { applyPhysics } from '../game/Physics';
import { collideTiles, collideEnemies, collidePowerUps } from '../game/Collision';
import { camera, updateCamera } from '../game/Camera';
import { playSound } from '../game/Sound';
import { rectIntersect } from '../game/Collision';
import { EnemyEntity } from '../game/Types';
import { MobileControls } from './MobileControls';

const getEnemiesForLevel = (levelId: LevelId): EnemyEntity[] => {
    if (levelId === '1-1') {
        return [
            new Enemy(22 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(40 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(50 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(52 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(80 * 32, 8 * 32, "MARGS", "#8E44AD"),
            new Enemy(96 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(110 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(130 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(170 * 32, 13 * 32, "MARGS", "#8E44AD")
        ];
    } else if (levelId === '1-2') {
        return [
            new Enemy(40 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(70 * 32, 13 * 32, "MARGS", "#8E44AD"),
            new Enemy(100 * 32, 13 * 32, "MARGS", "#8E44AD")
        ];
    } else if (levelId === '1-3') {
        return [
            new Bouncer(50 * 32, 10 * 32)
        ];
    }
    return [];
};

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [screen, setScreen] = useState<'start' | 'select' | 'game'>('start');
    const running = screen === 'game';
    const [character, setCharacter] = useState<"ginja" | "dentist" | "passive">("ginja");
    
    const gameRef = useRef({
        player: new Player() as Player,
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
        ] as EnemyEntity[],
        mushrooms: [] as Mushroom[],
        coins: [] as Coin[],
        keys: {} as Record<string, boolean>,
        timer: 250,
        lastTimerUpdate: Date.now(),
        introMusic: null as HTMLAudioElement | null,
        score: 0,
        combo: 0,
        lastEnemyDefeatedTime: 0,
        levelTransitionState: 'none' as 'none' | 'sliding' | 'walking' | 'fireworks',
        levelTransitionTimer: 0,
        levelTransitionScore: 0,
        levelTransitionScoreX: 0,
        levelTransitionScoreY: 0,
        levelTransitionNextLevel: null as LevelId | null,
        fireworks: [] as {x: number, y: number, timer: number, particles: {vx: number, vy: number, color: string}[]}[]
    });

    useEffect(() => {
        const music = new Audio('/music/Super Ginger World Select V1.mp3');
        music.loop = true;
        gameRef.current.introMusic = music;

        return () => {
            music.pause();
            music.src = "";
        };
    }, []);

    useEffect(() => {
        if (screen === 'start' || screen === 'select') {
            gameRef.current.introMusic?.play().catch(() => {});
        } else {
            gameRef.current.introMusic?.pause();
        }
    }, [screen]);

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
            setCurrentLevel('1-1');
            gameRef.current.tiles = getTiles();
            gameRef.current.enemies = getEnemiesForLevel('1-1');
            gameRef.current.player.x = 100;
            gameRef.current.player.y = 400;
            gameRef.current.player.vx = 0;
            gameRef.current.player.vy = 0;
            gameRef.current.player.state = "small";
            gameRef.current.timer = 250;
            gameRef.current.lastTimerUpdate = Date.now();
            if (character === "dentist") {
                gameRef.current.player.h = 64;
                gameRef.current.player.w = 48;
            } else {
                gameRef.current.player.h = 48;
                gameRef.current.player.w = 32;
            }
        };

        const loop = () => {
            const { player, tiles, clouds, scenery, enemies, mushrooms, coins, keys } = gameRef.current;

            if (gameRef.current.levelTransitionState === 'none') {
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
                collideEnemies(player, enemies, reset, () => {
                    const now = Date.now();
                    if (now - gameRef.current.lastEnemyDefeatedTime < 1000) {
                        gameRef.current.combo++;
                    } else {
                        gameRef.current.combo = 1;
                    }
                    gameRef.current.score += 100 * gameRef.current.combo;
                    gameRef.current.lastEnemyDefeatedTime = now;
                });
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

                // Pipe transition
                if (keys['ArrowDown'] && player.onGround && currentLevelId === '1-1') {
                    const pipeX = 46 * TILE;
                    const pipeY = 10 * TILE;
                    // Check if player's center is within the pipe's width and player is standing on top of it
                    if (player.x + player.w / 2 > pipeX && player.x + player.w / 2 < pipeX + 2 * TILE) {
                        if (Math.abs(player.y + player.h - pipeY) < 5) {
                            setCurrentLevel('1-1-cave');
                            gameRef.current.tiles = getTiles();
                            gameRef.current.enemies = getEnemiesForLevel('1-1-cave');
                            gameRef.current.player.x = 100;
                            gameRef.current.player.y = 100;
                        }
                    }
                }

                // Exit pipe transition (1-1-cave to 1-1)
                if (keys['ArrowRight'] && player.onGround && currentLevelId === '1-1-cave') {
                    const exitPipeX = 42 * TILE;
                    if (player.x > exitPipeX) {
                        setCurrentLevel('1-1');
                        gameRef.current.tiles = getTiles();
                        gameRef.current.enemies = getEnemiesForLevel('1-1');
                        gameRef.current.player.x = 164 * TILE;
                        gameRef.current.player.y = 10 * TILE; // Top of the exit pipe in 1-1
                    }
                }

                // Flagpole transition
                const flagTile = tiles.find(t => t.type === 'flagpole' && rectIntersect(player, t));
                if (flagTile) {
                    gameRef.current.levelTransitionState = 'sliding';
                    gameRef.current.levelTransitionTimer = 0;
                    
                    // Calculate score based on height
                    const flagTopY = 3 * TILE;
                    const flagBottomY = 14 * TILE - player.h;
                    const heightRatio = 1 - Math.max(0, Math.min(1, (player.y - flagTopY) / (flagBottomY - flagTopY)));
                    
                    let score = 100;
                    if (heightRatio > 0.9) score = 5000;
                    else if (heightRatio > 0.7) score = 2000;
                    else if (heightRatio > 0.5) score = 1000;
                    else if (heightRatio > 0.3) score = 500;
                    
                    gameRef.current.levelTransitionScore = score;
                    gameRef.current.levelTransitionScoreX = player.x;
                    gameRef.current.levelTransitionScoreY = player.y;
                    gameRef.current.score += score;
                    
                    if (currentLevelId === '1-1') {
                        gameRef.current.levelTransitionNextLevel = '1-2';
                    } else if (currentLevelId === '1-2') {
                        gameRef.current.levelTransitionNextLevel = '1-3';
                    } else {
                        gameRef.current.levelTransitionNextLevel = null;
                    }
                }
            }

            if (gameRef.current.levelTransitionState !== 'none') {
                if (gameRef.current.levelTransitionState === 'sliding') {
                    player.vx = 0;
                    player.vy = 2;
                    player.y += player.vy;
                    if ('facingRight' in player) {
                        (player as any).facingRight = true;
                    }
                    if (player.y >= 14 * TILE - player.h) {
                        player.y = 14 * TILE - player.h;
                        gameRef.current.levelTransitionState = 'walking';
                    }
                } else if (gameRef.current.levelTransitionState === 'walking') {
                    player.vx = 2;
                    player.x += player.vx;
                    player.vy = 0;
                    if ('walkDistance' in player) {
                        (player as any).walkDistance += Math.abs(player.vx);
                    }
                    
                    gameRef.current.levelTransitionTimer++;
                    
                    if (gameRef.current.levelTransitionTimer % 30 === 0 && gameRef.current.levelTransitionTimer < 150) {
                        const fx = camera.x + 200 + Math.random() * 400;
                        const fy = 100 + Math.random() * 200;
                        const particles = [];
                        for (let i = 0; i < 30; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const speed = Math.random() * 4;
                            particles.push({
                                vx: Math.cos(angle) * speed,
                                vy: Math.sin(angle) * speed,
                                color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)]
                            });
                        }
                        gameRef.current.fireworks.push({ x: fx, y: fy, timer: 0, particles });
                        playSound('firework');
                    }
                    
                    if (player.x > camera.x + canvas.width + 50) {
                        if (gameRef.current.levelTransitionNextLevel) {
                            setCurrentLevel(gameRef.current.levelTransitionNextLevel);
                            gameRef.current.tiles = getTiles();
                            gameRef.current.enemies = getEnemiesForLevel(gameRef.current.levelTransitionNextLevel);
                            gameRef.current.player.x = 100;
                            gameRef.current.player.y = 100;
                            gameRef.current.levelTransitionState = 'none';
                            gameRef.current.fireworks = [];
                        }
                    }
                }
                
                gameRef.current.fireworks.forEach(fw => {
                    fw.timer++;
                    fw.particles.forEach(p => {
                        p.vx *= 0.95;
                        p.vy += 0.05;
                    });
                });
                
                if (gameRef.current.levelTransitionScore > 0) {
                    gameRef.current.levelTransitionScoreY -= 1;
                }
            } else {
                // Update Timer
                const now = Date.now();
                if (now - gameRef.current.lastTimerUpdate >= 1000) {
                    gameRef.current.timer -= 1;
                    gameRef.current.lastTimerUpdate = now;
                }
                if (gameRef.current.timer <= 0) {
                    reset();
                }
            }

            // Camera
            if (gameRef.current.levelTransitionState === 'none') {
                updateCamera(player, canvas.width);
            }

            if (player.y > canvas.height) reset();

            // Draw
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Sky Background
            ctx.fillStyle = "#5C94FC";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Clouds
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
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
                }
            }

            // Draw Entities
            mushrooms.forEach(m => m.draw(ctx, camera.x));
            coins.forEach(c => c.draw(ctx, camera.x));
            enemies.forEach(e => e.draw(ctx, camera.x));
            player.draw(ctx, camera.x);

            // Draw Fireworks
            gameRef.current.fireworks.forEach(fw => {
                fw.particles.forEach(p => {
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(fw.x - camera.x + p.vx * fw.timer, fw.y + p.vy * fw.timer, 2, 0, Math.PI * 2);
                    ctx.fill();
                });
            });

            // Draw Transition Score
            if (gameRef.current.levelTransitionState !== 'none' && gameRef.current.levelTransitionScore > 0) {
                ctx.fillStyle = "white";
                ctx.font = "bold 16px monospace";
                ctx.textAlign = "center";
                ctx.fillText(gameRef.current.levelTransitionScore.toString(), gameRef.current.levelTransitionScoreX - camera.x + player.w / 2, gameRef.current.levelTransitionScoreY);
            }

            // Draw HUD
            ctx.fillStyle = "white";
            ctx.font = "bold 24px monospace";
            ctx.textAlign = "left";
            ctx.fillText("SCORE", 50, 50);
            ctx.fillText(gameRef.current.score.toString().padStart(6, '0'), 50, 80);
            
            ctx.textAlign = "center";
            if (gameRef.current.combo > 1) {
                ctx.fillStyle = "#F1C40F";
                ctx.fillText(`COMBO x ${gameRef.current.combo}`, canvas.width / 2, 50);
            }
            ctx.fillStyle = "white";
            ctx.fillText("WORLD", canvas.width / 2 + 100, 50);
            ctx.fillText(currentLevelId.toUpperCase(), canvas.width / 2 + 100, 80);
            
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
            {screen === 'start' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white z-10">
                    <h1 className="text-6xl font-bold mb-8 [text-shadow:3px_3px_0_#000]">Super Ginger World</h1>
                    <button 
                        onClick={() => {
                            gameRef.current.introMusic?.play().catch(() => {});
                            setScreen('select');
                        }}
                        className="px-10 py-5 text-2xl bg-[#c84c0c] text-white border-4 border-white font-bold cursor-pointer hover:bg-[#a03c0a] transition-colors"
                    >
                        START
                    </button>
                </div>
            )}
            
            {screen === 'select' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white z-10">
                    <h1 className="text-4xl font-bold mb-8 [text-shadow:3px_3px_0_#000]">SELECT CHARACTER</h1>
                    
                    <div className="flex gap-4 justify-center mb-8">
                        <button 
                            onClick={() => setCharacter("ginja")}
                            className={`px-4 py-2 border-2 ${character === "ginja" ? "border-yellow-400 bg-yellow-400/20" : "border-white"}`}
                        >
                            Ginja Jay
                        </button>
                        <button 
                            onClick={() => setCharacter("dentist")}
                            className={`px-4 py-2 border-2 ${character === "dentist" ? "border-yellow-400 bg-yellow-400/20" : "border-white"}`}
                        >
                            Darren Stewart
                        </button>
                        <button 
                            onClick={() => setCharacter("passive")}
                            className={`px-4 py-2 border-2 ${character === "passive" ? "border-yellow-400 bg-yellow-400/20" : "border-white"}`}
                        >
                            Passive
                        </button>
                    </div>

                    <button 
                        onClick={() => {
                            playSound('jump');
                            if (character === "dentist") {
                                gameRef.current.player = new DentistPlayer();
                            } else if (character === "passive") {
                                gameRef.current.player = new PassivePlayer();
                            } else {
                                gameRef.current.player = new Player();
                            }
                            setScreen('game');
                        }}
                        className="px-10 py-5 text-xl bg-[#c84c0c] text-white border-4 border-white font-bold cursor-pointer hover:bg-[#a03c0a] transition-colors"
                    >
                        START ENGINE
                    </button>
                </div>
            )}
            <canvas ref={canvasRef} width={1024} height={640} className="block w-full h-full object-contain bg-[#5C94FC]" />
            {screen === 'game' && (
                <MobileControls onControl={(code, isDown) => {
                    gameRef.current.keys[code] = isDown;
                    if (isDown && (code === 'Space' || code === 'ArrowUp' || code === 'KeyW')) {
                        if (gameRef.current.player.onGround) {
                            playSound('jump');
                        }
                    }
                }} />
            )}
        </div>
    );
}

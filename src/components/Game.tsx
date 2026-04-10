import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../game/Player';
import { DentistPlayer } from '../game/DentistPlayer';
import { PassivePlayer } from '../game/PassivePlayer';
import { Enemy, Bouncer, Cookie, Walker } from '../game/Enemy';
import { PowerUp } from '../game/PowerUp';
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
            new Cookie(40 * 32, 13 * 32),
            new Cookie(70 * 32, 13 * 32),
            new Cookie(100 * 32, 13 * 32)
        ];
    } else if (levelId === '1-3') {
        return [
            // Intro
            new Walker(10 * TILE, 13 * TILE),
            
            // First Mushroom section
            new Cookie(36 * TILE, 9 * TILE),
            new Cookie(56 * TILE, 9 * TILE),
            
            // Ground section
            new Walker(85 * TILE, 13 * TILE),
            new Walker(95 * TILE, 13 * TILE),
            
            // High Altitude section
            new Cookie(106 * TILE, 8 * TILE),
            new Cookie(116 * TILE, 5 * TILE),
            new Cookie(136 * TILE, 6 * TILE),
            new Cookie(146 * TILE, 9 * TILE),
            
            // Transition
            new Walker(160 * TILE, 13 * TILE),
            
            // THE BOSS (Elevated Arena floor at y=9, so Bouncer h=64 at y=7)
            new Bouncer(210 * TILE, 7 * TILE)
        ];
    }
    return [];
};

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [screen, setScreen] = useState<'start' | 'select' | 'game' | 'tbc'>('start');
    const running = screen === 'game';
    const [startLevel, setStartLevel] = useState<LevelId>('1-1');
    const [character, setCharacter] = useState<"ginja" | "dentist" | "passive">("ginja");
    const [touchStartX, setTouchStartX] = useState(0);
    const characters = ["ginja", "dentist", "passive"] as const;
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (screen !== 'select') return;
            const currentIndex = characters.indexOf(character);
            if (e.key === 'ArrowRight') {
                const nextIndex = (currentIndex + 1) % characters.length;
                handleCharacterChange(characters[nextIndex]);
            } else if (e.key === 'ArrowLeft') {
                const nextIndex = (currentIndex - 1 + characters.length) % characters.length;
                handleCharacterChange(characters[nextIndex]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [screen, character]);

    const handleCharacterChange = (nextChar: string) => {
        setCharacter(nextChar as any);
        if (nextChar === "ginja") {
            new Audio('/soundeffects/gingerjesus.mp3').play().catch(console.error);
        } else if (nextChar === "dentist") {
            const audio = new Audio('/soundeffects/pushin.mp3');
            audio.play().catch(e => console.error("Audio playback failed:", e));
        }
    };
    
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
        powerups: [] as PowerUp[],
        coins: [] as Coin[],
        keys: {} as Record<string, boolean>,
        timer: 250,
        lastTimerUpdate: Date.now(),
        introMusic: null as HTMLAudioElement | null,
        levelMusic: null as HTMLAudioElement | null,
        score: 0,
        coinsCollected: 0,
        lives: 3,
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

    const applyLevelSettings = (levelId: LevelId) => {
        gameRef.current.timer = levelId === '1-2' ? 233 : 250;
        
        if (gameRef.current.levelMusic) {
            gameRef.current.levelMusic.pause();
            gameRef.current.levelMusic.currentTime = 0;
            gameRef.current.levelMusic = null;
        }
        
        let musicPath = '';
        if (levelId === '1-2' || levelId === '1-1-cave') {
            musicPath = '/music/Crystalline Caverns.mp3';
        } else if (levelId === '1-1' || levelId === '1-3') {
            musicPath = '/music/Super Ginger World 1-1.mp3';
        }

        if (musicPath) {
            const music = new Audio(musicPath);
            music.loop = true;
            music.play().catch(() => {});
            gameRef.current.levelMusic = music;
        }
    };

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
            if (gameRef.current.introMusic) {
                gameRef.current.introMusic.currentTime = 0;
                gameRef.current.introMusic.play().catch(() => {});
            }
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
            if (character === "ginja") {
                new Audio('/soundeffects/gingerjesus.mp3').play().catch(() => {});
            }
            gameRef.current.lives -= 1;
            if (gameRef.current.lives < 0) {
                setScreen('start');
                return;
            }
            gameRef.current.tiles = getTiles();
            
            let resetLevelId = currentLevelId;
            if (currentLevelId === '1-1-cave') {
                resetLevelId = '1-1';
                setCurrentLevel('1-1');
            }
            
            gameRef.current.enemies = getEnemiesForLevel(resetLevelId);
            
            if (resetLevelId === '1-2') {
                gameRef.current.player.x = 8 * TILE;
                gameRef.current.player.y = 2 * TILE;
            } else {
                gameRef.current.player.x = 100;
                gameRef.current.player.y = 480;
            }
            gameRef.current.player.vx = 0;
            gameRef.current.player.vy = 0;
            gameRef.current.player.state = "small";
            applyLevelSettings(resetLevelId);
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
            const { player, tiles, clouds, scenery, enemies, powerups, coins, keys } = gameRef.current;

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

                // Update PowerUps
                powerups.forEach(m => {
                    m.update();
                    applyPhysics(m);
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
                        gameRef.current.coinsCollected += 1;
                        if (gameRef.current.coinsCollected >= 100) {
                            gameRef.current.coinsCollected -= 100;
                            gameRef.current.lives += 1;
                            playSound('jump'); // 1-UP sound fallback
                        }
                    }
                });

                // Remove inactive coins
                gameRef.current.coins = coins.filter(c => c.active);

                // Collisions
                collidePowerUps(player, powerups);
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
                    
                    // Spawn powerup if it's the first question block
                    if (t.type === 'question' && t.x === 15 * TILE && t.y === 9 * TILE) {
                        gameRef.current.powerups.push(new PowerUp(t.x, t.y - 20, player.characterId));
                    }
                });

                // Collect static coins (tiles)
                tiles.forEach(t => {
                    if (t.type === 'coin' && !t.destroyed && rectIntersect(player, t)) {
                        t.destroyed = true;
                        gameRef.current.score += 200;
                        gameRef.current.coinsCollected += 1;
                        
                        // Extra Life every 100 coins
                        if (gameRef.current.coinsCollected >= 100) {
                            gameRef.current.coinsCollected = 0;
                            gameRef.current.lives += 1;
                            new Audio('/soundeffects/extralife.mp3').play().catch(() => {});
                        } else {
                            playSound('coin');
                        }
                    }
                });

                // Pipe transition (1-1 to 1-1-cave)
                if (keys['ArrowDown'] && player.onGround && currentLevelId === '1-1') {
                    const pipeX = 46 * TILE;
                    const pipeY = 10 * TILE;
                    // Check if player's center is within the pipe's width and player is standing on top of it
                    if (player.x + player.w / 2 > pipeX && player.x + player.w / 2 < pipeX + 2 * TILE) {
                        if (Math.abs(player.y + player.h - pipeY) < 5) {
                            setCurrentLevel('1-1-cave');
                            gameRef.current.tiles = getTiles();
                            gameRef.current.enemies = getEnemiesForLevel('1-1-cave');
                            gameRef.current.player.x = 10 * TILE;
                            gameRef.current.player.y = 2 * TILE;
                            gameRef.current.player.vy = 2;
                        }
                    }
                }

                // Exit pipe transition (1-1-cave to 1-1)
                if (keys['ArrowDown'] && player.onGround && currentLevelId === '1-1-cave') {
                    const pipeX = 44 * TILE;
                    const pipeY = 12 * TILE;
                    // Check if player's center is within the pipe's width and player is standing on top of it
                    if (player.x + player.w / 2 > pipeX && player.x + player.w / 2 < pipeX + 2 * TILE) {
                        if (Math.abs(player.y + player.h - pipeY) < 5) {
                            setCurrentLevel('1-1');
                            gameRef.current.tiles = getTiles();
                            gameRef.current.enemies = getEnemiesForLevel('1-1');
                            gameRef.current.player.x = 161 * TILE; // Next to the pipe, not ON it
                            gameRef.current.player.y = 14 * TILE - player.h; // On the ground
                            new Audio('/soundeffects/gingerjesus.mp3').play().catch(() => {});
                            applyLevelSettings('1-1');
                        }
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
                    
                    // Castle Entrance Logic
                    let castleEntranceX = 204 * TILE; // Default for 1-1
                    if (currentLevelId === '1-2') castleEntranceX = 244 * TILE;
                    else if (currentLevelId === '1-3') castleEntranceX = 246 * TILE;

                    if (player.x >= castleEntranceX - 2) { // Slightly more lenient detection
                        player.x = castleEntranceX;
                        player.vx = 0;
                        gameRef.current.levelTransitionTimer++;
                        
                        if (gameRef.current.levelTransitionTimer > 180) { // Wait a bit after walking in
                            if (gameRef.current.levelTransitionNextLevel) {
                                setCurrentLevel(gameRef.current.levelTransitionNextLevel);
                                gameRef.current.tiles = getTiles();
                                gameRef.current.enemies = getEnemiesForLevel(gameRef.current.levelTransitionNextLevel);
                                if (gameRef.current.levelTransitionNextLevel === '1-2') {
                                    gameRef.current.player.x = 8 * TILE;
                                    gameRef.current.player.y = 2 * TILE;
                                    gameRef.current.player.vy = 2;
                                } else {
                                    gameRef.current.player.x = 100;
                                    gameRef.current.player.y = 480;
                                }
                                applyLevelSettings(gameRef.current.levelTransitionNextLevel);
                                gameRef.current.levelTransitionState = 'none';
                                gameRef.current.fireworks = [];
                            } else if (currentLevelId === '1-3') {
                                setScreen('tbc');
                            }
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
            
            // Background
            if (currentLevelId.includes('cave') || currentLevelId === '1-2') {
                ctx.fillStyle = "#000";
            } else {
                ctx.fillStyle = "#5C94FC";
            }
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Clouds
            if (!currentLevelId.includes('cave') && currentLevelId !== '1-2') {
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
            }

            // Draw Scenery (Plants/Hills)
            if (!currentLevelId.includes('cave') && currentLevelId !== '1-2') {
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
            }

            // Draw Peacocks Gym Sign
            if (currentLevelId === '1-2' && camera.x > 220 * TILE) {
                ctx.fillStyle = "white";
                ctx.font = "bold 24px Arial";
                ctx.textAlign = "center";
                ctx.fillText("PEACOCKS GYM", 249.5 * TILE - camera.x, 3.5 * TILE);
            }

            // Draw Tiles
            for (let t of tiles) {
                if (t.destroyed) continue;

                // Culling: Only draw if the tile is within the viewport (with a small buffer)
                if (t.x - camera.x + t.w < -TILE || t.x - camera.x > canvas.width + TILE) continue;

                if (t.type === 'ground') {
                    const isCave = currentLevelId === '1-2' || currentLevelId.includes('cave');
                    ctx.fillStyle = isCave ? "#40deff" : "#c84c0c"; // Teal for cave
                    ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.fillStyle = isCave ? "#adefff" : "#fca044";
                    ctx.fillRect(t.x - camera.x, t.y, t.w, 4);
                } else if (t.type === 'brick') {
                    const isCave = currentLevelId === '1-2' || currentLevelId.includes('cave');
                    ctx.fillStyle = isCave ? "#40deff" : "#c84c0c";
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
                    const isCave = currentLevelId === '1-2' || currentLevelId.includes('cave');
                    if (t.used) {
                        ctx.fillStyle = isCave ? "#40deff" : "#c84c0c";
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
                    const isCave = currentLevelId === '1-2' || currentLevelId.includes('cave');
                    ctx.fillStyle = isCave ? "#40deff" : "#c84c0c";
                    ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x - camera.x, t.y, t.w, t.h);
                    ctx.fillStyle = isCave ? "#adefff" : "#fca044";
                    ctx.fillRect(t.x - camera.x + 4, t.y + 4, 6, 6);
                } else if (t.type === 'pipe') {
                    ctx.fillStyle = "#00a800";
                    ctx.fillRect(t.x - camera.x, t.y, t.isLeft ? t.w + 1 : t.w, t.h);
                    
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
                            capW += 5; // 4 for overhang, +1 for seam overlap
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
                            ctx.fillRect(capX + 8, t.y + 2, 4, 20);
                            ctx.fillRect(capX + 16, t.y + 2, 2, 20);
                        }
                    }

                    if (t.isBottom) {
                        ctx.fillStyle = "#00a800";
                        let capX = t.x - camera.x;
                        let capW = t.w;
                        if (t.isLeft) {
                            capX -= 4;
                            capW += 5; // 4 for overhang, +1 for seam overlap
                        } else {
                            capW += 4;
                        }
                        const capY = t.y + t.h - 24;
                        ctx.fillRect(capX, capY, capW, 24);
                        
                        ctx.beginPath();
                        // Top edge
                        ctx.moveTo(capX, capY);
                        ctx.lineTo(capX + capW, capY);
                        // Bottom edge
                        ctx.moveTo(capX, capY + 24);
                        ctx.lineTo(capX + capW, capY + 24);
                        // Side edge
                        if (t.isLeft) {
                            ctx.moveTo(capX, capY);
                            ctx.lineTo(capX, capY + 24);
                        } else {
                            ctx.moveTo(capX + capW, capY);
                            ctx.lineTo(capX + capW, capY + 24);
                        }
                        ctx.stroke();

                        if (t.isLeft) {
                            ctx.fillStyle = "#80d010";
                            ctx.fillRect(capX + 8, capY + 2, 4, 20);
                            ctx.fillRect(capX + 16, capY + 2, 2, 20);
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
                    const tx = Math.floor(t.x / TILE);
                    const ty = Math.floor(t.y / TILE);
                    let castleBaseX = 202;
                    if (currentLevelId === '1-2') castleBaseX = 242;
                    const relX = tx - castleBaseX; // Left side of castle
                    const relY = ty - 9;   // Top of castle
                    
                    // Shape: Top is 3 wide (relX 1,2,3), Bottom is 5 wide (relX 0,1,2,3,4)
                    const isTopPart = relY < 2;
                    const isBasePart = relY >= 2;
                    const isInTopRoom = isTopPart && relX >= 1 && relX <= 3;
                    
                    if (isInTopRoom || isBasePart) {
                        // Brick Base
                        ctx.fillStyle = "#c84c0c";
                        ctx.fillRect(t.x - camera.x, t.y, t.w, t.h);
                        
                        // Brick Grid lines
                        ctx.strokeStyle = "#000";
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        // Horizontal middle
                        ctx.moveTo(t.x - camera.x, t.y + t.h/2);
                        ctx.lineTo(t.x - camera.x + t.w, t.y + t.h/2);
                        // Vertical lines for brick pattern
                        ctx.moveTo(t.x - camera.x + t.w/2, t.y);
                        ctx.lineTo(t.x - camera.x + t.w/2, t.y + t.h/2);
                        ctx.moveTo(t.x - camera.x + t.w/4, t.y + t.h/2);
                        ctx.lineTo(t.x - camera.x + t.w/4, t.y + t.h);
                        ctx.moveTo(t.x - camera.x + t.w*0.75, t.y + t.h/2);
                        ctx.lineTo(t.x - camera.x + t.w*0.75, t.y + t.h);
                        ctx.stroke();

                        // Battlements
                        const drawBattlements = () => {
                            const bW = t.w / 4;
                            const bH = 10;
                            for (let i = 0; i < 2; i++) {
                                const bx = t.x - camera.x + (i * 2 + 0.5) * bW;
                                ctx.fillStyle = "#c84c0c";
                                ctx.fillRect(bx, t.y - bH, bW, bH);
                                ctx.strokeStyle = "#000";
                                ctx.strokeRect(bx, t.y - bH, bW, bH);
                                // Highlight line
                                ctx.fillStyle = "#fca044";
                                ctx.fillRect(bx, t.y - bH, bW, 2);
                            }
                        };
                        
                        if (relY === 0 && relX >= 1 && relX <= 3) drawBattlements();
                        if (relY === 2 && (relX === 0 || relX === 4)) drawBattlements();

                        // Door (Centered in base)
                        if (relX === 2 && relY >= 3) {
                            ctx.fillStyle = "#000";
                            ctx.fillRect(t.x - camera.x + 5, t.y, t.w - 10, t.h);
                            if (relY === 3) {
                                // Arched entrance
                                ctx.beginPath();
                                ctx.arc(t.x - camera.x + t.w/2, t.y + 10, t.w/2 - 5, Math.PI, 0);
                                ctx.fill();
                            }
                        }
                        
                        // Windows (Slits in top part)
                        if (relX === 2 && relY === 0) {
                            ctx.fillStyle = "#000";
                            ctx.fillRect(t.x - camera.x + 8, t.y + 15, 6, 15);
                            ctx.fillRect(t.x - camera.x + 26, t.y + 15, 6, 15);
                        }
                    }
                } else if (t.type === 'coin') {
                    const drawX = t.x - camera.x;
                    const drawY = t.y;
                    ctx.fillStyle = "#fca044";
                    // Draw a centered coin
                    ctx.beginPath();
                    ctx.ellipse(drawX + TILE/2, drawY + TILE/2, 8, 12, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    // Coin line
                    ctx.beginPath();
                    ctx.moveTo(drawX + TILE/2, drawY + TILE/2 - 6);
                    ctx.lineTo(drawX + TILE/2, drawY + TILE/2 + 6);
                    ctx.stroke();
                }
            }

            // Draw Entities
            powerups.forEach(m => {
                if (m.x - camera.x + m.w > 0 && m.x - camera.x < canvas.width) m.draw(ctx, camera.x);
            });
            coins.forEach(c => {
                if (c.x - camera.x + c.w > 0 && c.x - camera.x < canvas.width) c.draw(ctx, camera.x);
            });
            enemies.forEach(e => {
                if (e.x - camera.x + e.w > 0 && e.x - camera.x < canvas.width) e.draw(ctx, camera.x);
            });
            
            // Hide player when walking into the castle door
            const isEnteringCastle = gameRef.current.levelTransitionState === 'walking' && player.x >= (currentLevelId === '1-2' ? 247 * TILE : 203.8 * TILE);
            if (!isEnteringCastle) {
                player.draw(ctx, camera.x);
            }

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
            ctx.fillText(`COINS ${gameRef.current.coinsCollected.toString().padStart(2, '0')}`, canvas.width / 2 - 180, 50);
            ctx.fillText(`LIVES ${gameRef.current.lives}`, canvas.width / 2 - 180, 80);

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
                <div 
                    className="absolute inset-0 z-20 flex items-center justify-center bg-[#5C94FC] bg-no-repeat bg-center bg-contain"
                    style={{ backgroundImage: "url('/screens/start_screen.png')" }}
                >
                    {/* Invisible button sitting over the baked-in box */}
                    <button 
                        onClick={() => {
                            gameRef.current.introMusic?.play().catch(() => {});
                            setScreen('select');
                        }}
                        className="w-[35%] h-[22%] max-w-[420px] max-h-[160px] cursor-pointer bg-transparent border-none outline-none focus:outline-none absolute"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                        title="Start Engine"
                    />
                </div>
            )}
            
            {screen === 'select' && (
                <div 
                    className="absolute inset-0 z-10" 
                    style={{ backgroundImage: 'url(/screens/playerscreen.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
                    onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                    onTouchEnd={(e) => {
                        const touchEndX = e.changedTouches[0].clientX;
                        const diff = touchStartX - touchEndX;
                        if (Math.abs(diff) > 50) {
                            const currentIndex = characters.indexOf(character);
                            let nextIndex;
                            if (diff > 0) {
                                nextIndex = (currentIndex + 1) % characters.length;
                            } else {
                                nextIndex = (currentIndex - 1 + characters.length) % characters.length;
                            }
                            handleCharacterChange(characters[nextIndex]);
                        }
                    }}
                >
                    <h1 className="absolute top-10 left-1/2 -translate-x-1/2 text-4xl font-bold text-white [text-shadow:3px_3px_0_#000]">SELECT CHARACTER</h1>
                    
                    {/* Buttons positioned absolutely to align with characters in playerscreen.png */}
                    <div className="hidden md:block">
                        <button 
                            onClick={() => {
                                setCharacter("ginja");
                                new Audio('/soundeffects/gingerjesus.mp3').play().catch(console.error);
                            }}
                            className={`absolute top-[25%] left-[1%] w-[25%] h-[55%] border-4 ${character === "ginja" ? "border-yellow-400 bg-yellow-400/20" : "border-transparent"}`}
                        />
                        <button 
                            onClick={() => {
                                setCharacter("dentist");
                                const audio = new Audio('/soundeffects/pushin.mp3');
                                audio.play().catch(e => console.error("Audio playback failed:", e));
                            }}
                            className={`absolute top-[25%] left-[38%] w-[25%] h-[55%] border-4 ${character === "dentist" ? "border-yellow-400 bg-yellow-400/20" : "border-transparent"}`}
                        />
                        <button 
                            onClick={() => setCharacter("passive")}
                            className={`absolute top-[25%] left-[75%] w-[25%] h-[55%] border-4 ${character === "passive" ? "border-yellow-400 bg-yellow-400/20" : "border-transparent"}`}
                        />
                    </div>
                    <div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-white">
                        <div className="mb-8">
                            <label className="mr-4 text-xl font-bold">WARP TO LEVEL:</label>
                            <select 
                                value={startLevel} 
                                onChange={(e) => setStartLevel(e.target.value as LevelId)}
                                className="px-4 py-2 text-xl bg-[#000] border-2 border-white text-white font-bold"
                            >
                                <option value="1-1">World 1-1</option>
                                <option value="1-1-cave">World 1-1 Cave Segment</option>
                                <option value="1-2">World 1-2 (Underground)</option>
                                <option value="1-3">World 1-3</option>
                            </select>
                        </div>

                        <button 
                            onClick={() => {
                                playSound('jump');
                                setCurrentLevel(startLevel);
                                
                                // Initialize new player
                                if (character === "dentist") {
                                    gameRef.current.player = new DentistPlayer();
                                } else if (character === "passive") {
                                    gameRef.current.player = new PassivePlayer();
                                } else {
                                    gameRef.current.player = new Player();
                                    if (character === "ginja") {
                                        new Audio('/soundeffects/ohgosh.mp3').play().catch(() => {});
                                    }
                                }
                                
                                // Initialize level
                                gameRef.current.tiles = getTiles();
                                gameRef.current.clouds = getClouds();
                                gameRef.current.scenery = getScenery();
                                gameRef.current.enemies = getEnemiesForLevel(startLevel);
                                gameRef.current.powerups = [];
                                gameRef.current.coins = [];
                                gameRef.current.fireworks = [];
                                
                                // Reset State
                                gameRef.current.lives = 3;
                                gameRef.current.coinsCollected = 0;
                                gameRef.current.score = 0;
                                
                                if (startLevel === '1-2') {
                                    gameRef.current.player.x = 8 * TILE;
                                    gameRef.current.player.y = 2 * TILE;
                                }
                                
                                applyLevelSettings(startLevel);
                                
                                setScreen('game');
                            }}
                            className="px-10 py-5 text-xl bg-[#c84c0c] text-white border-4 border-white font-bold cursor-pointer hover:bg-[#a03c0a] transition-colors"
                        >
                            START ENGINE
                        </button>
                    </div>

                    <div className="md:hidden absolute inset-0 z-10 flex flex-col items-center justify-center bg-blue-500">
                        <h1 className="text-3xl font-bold text-white mb-4 [text-shadow:2px_2px_0_#000]">SELECT PLAYER</h1>
                        <div className="relative w-full h-1/3 flex items-center justify-center">
                            <img 
                                src={`/mobilescreens/${character === 'ginja' ? 'gingerjaymob' : character === 'dentist' ? 'darrenmobile' : 'passivemob'}.png`} 
                                alt="Selected Character" 
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                        <div className="mt-4 text-center text-white">
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-1">WARP TO LEVEL:</label>
                                <select 
                                    value={startLevel} 
                                    onChange={(e) => setStartLevel(e.target.value as LevelId)}
                                    className="px-2 py-1 text-sm bg-[#000] border-2 border-white text-white font-bold"
                                >
                                    <option value="1-1">World 1-1</option>
                                    <option value="1-1-cave">World 1-1 Cave Segment</option>
                                    <option value="1-2">World 1-2 (Underground)</option>
                                    <option value="1-3">World 1-3</option>
                                </select>
                            </div>

                            <button 
                                onClick={() => {
                                    playSound('jump');
                                    setCurrentLevel(startLevel);
                                    
                                    // Initialize new player
                                    if (character === "dentist") {
                                        gameRef.current.player = new DentistPlayer();
                                    } else if (character === "passive") {
                                        gameRef.current.player = new PassivePlayer();
                                    } else {
                                        gameRef.current.player = new Player();
                                        if (character === "ginja") {
                                            new Audio('/soundeffects/ohgosh.mp3').play().catch(() => {});
                                        }
                                    }
                                    
                                    // Initialize level
                                    gameRef.current.tiles = getTiles();
                                    gameRef.current.clouds = getClouds();
                                    gameRef.current.scenery = getScenery();
                                    gameRef.current.enemies = getEnemiesForLevel(startLevel);
                                    gameRef.current.powerups = [];
                                    gameRef.current.coins = [];
                                    gameRef.current.fireworks = [];
                                    
                                    // Reset State
                                    gameRef.current.lives = 3;
                                    gameRef.current.coinsCollected = 0;
                                    gameRef.current.score = 0;
                                    
                                    if (startLevel === '1-2') {
                                        gameRef.current.player.x = 8 * TILE;
                                        gameRef.current.player.y = 2 * TILE;
                                    }
                                    
                                    applyLevelSettings(startLevel);
                                    
                                    setScreen('game');
                                }}
                                className="px-6 py-3 text-sm bg-[#c84c0c] text-white border-2 border-white font-bold cursor-pointer hover:bg-[#a03c0a] transition-colors"
                            >
                                START ENGINE
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <canvas 
                ref={canvasRef} 
                width={1024} 
                height={640} 
                className={`block w-full h-full object-contain ${(currentLevelId.includes('cave') || currentLevelId === '1-2') && camera.x < 225 * TILE ? 'bg-[#000]' : 'bg-[#5C94FC]'}`} 
            />
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
            {screen === 'tbc' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black text-white p-10 text-center">
                    <h1 className="text-6xl font-bold mb-8 text-yellow-500 [text-shadow:4px_4px_0_#900]">LEVEL COMPLETE!</h1>
                    <p className="text-4xl font-bold mb-12">YOU HAVE DEFEATED BOUNCER (for now...)</p>
                    <div className="text-5xl font-black tracking-widest animate-pulse text-red-600 mb-12">
                        TO BE CONTINUED...
                    </div>
                    <button 
                        onClick={() => setScreen('start')}
                        className="px-8 py-4 bg-white text-black font-bold text-xl hover:bg-gray-300 transition-colors"
                    >
                        RETURN TO MENU
                    </button>
                    <div className="mt-12 text-gray-500 font-mono">
                        SUPER GINGER WORLD - WORLD 1 COMPLETE
                    </div>
                </div>
            )}
        </div>
    );
}

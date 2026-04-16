import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../game/players/Player';
import { DarrenPlayer } from '../game/players/darren';
import { PassivePlayer } from '../game/players/PassivePlayer';
import { TymelessPlayer } from '../game/players/TymelessPlayer';
import { DeenoPlayer } from '../game/players/deenoplayer';
import { RynoPlayer } from '../game/players/rynoplayer';
import { RomanPlayer } from '../game/players/romanplayer';
import { Tapped24Player } from '../game/players/tapped24player';
import { GramsPlayer } from '../game/players/gramsplayer';
import { Enemy, Bouncer, Cookie, Walker } from '../game/Enemy';
import { PowerUp } from '../game/PowerUp';
import { Coin } from '../game/Coin';
import { getTiles, getClouds, getScenery, setCurrentLevel, currentLevelId, LevelId } from '../game/Level';
import { TILE } from '../game/Constants';
import { applyPhysics } from '../game/Physics';
import { collideTiles, collideEnemies, collidePowerUps } from '../game/Collision';
import { camera, updateCamera } from '../game/Camera';
import { playSound } from '../game/Sound';
import { triggerGingerJayEasterEgg } from '../game/eastereggs';
import { rectIntersect } from '../game/Collision';
import { EnemyEntity } from '../game/Types';
import { MobileControls } from './MobileControls';

const getEnemiesForLevel = (levelId: LevelId): EnemyEntity[] => {
    if (levelId === '1-1') {
        return [
            new Enemy(22 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(42 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(52 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(93 * TILE, 8 * TILE, "MARGS", "#8E44AD"),
            new Enemy(96 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(110 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(130 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(170 * TILE, 13 * TILE, "MARGS", "#8E44AD")
        ];
    } else if (levelId === '1-2') {
        return [
            new Cookie(40 * TILE, 13 * TILE),
            new Cookie(70 * TILE, 13 * TILE),
            new Cookie(100 * TILE, 13 * TILE)
        ];
    } else if (levelId === '1-3') {
        return [
            new Walker(10 * TILE, 13 * TILE),
            new Enemy(20 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Cookie(28 * TILE, 13 * TILE),
            new Cookie(36 * TILE, 9 * TILE),
            new Enemy(45 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Cookie(56 * TILE, 9 * TILE),
            new Walker(65 * TILE, 13 * TILE),
            new Enemy(72 * TILE, 6 * TILE, "MARGS", "#8E44AD"),
            new Walker(85 * TILE, 13 * TILE),
            new Enemy(90 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Walker(95 * TILE, 13 * TILE),
            new Cookie(106 * TILE, 8 * TILE),
            new Walker(110 * TILE, 13 * TILE),
            new Cookie(116 * TILE, 5 * TILE),
            new Enemy(125 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Cookie(136 * TILE, 6 * TILE),
            new Walker(140 * TILE, 13 * TILE),
            new Cookie(146 * TILE, 9 * TILE),
            new Enemy(155 * TILE, 10 * TILE, "MARGS", "#8E44AD"),
            new Walker(160 * TILE, 13 * TILE),
            new Cookie(170 * TILE, 10 * TILE),
            new Walker(180 * TILE, 13 * TILE),
            new Enemy(195 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            


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
    const [character, setCharacter] = useState<"ginja" | "darren" | "passive" | "tymeless" | "deeno" | "ryno" | "roman" | "tapped24" | "grams">("ginja");
    const [musicVolume, setMusicVolume] = useState(0.5);
    const [touchStartX, setTouchStartX] = useState(0);
    const characters = ["ginja", "darren", "passive", "tymeless", "deeno", "ryno", "roman", "tapped24", "grams"] as const;
    
    // Internal resolution: Dynamic for mobile to fill the screen
    const [canvasWidth, setCanvasWidth] = useState(1024);
    const [canvasHeight, setCanvasHeight] = useState(640);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            
            if (mobile) {
                // Full bleed mobile resolution
                // We keep a fixed virtual width of 400 and scale height to match aspect ratio
                const virtualWidth = 400;
                const ratio = window.innerHeight / window.innerWidth;
                setCanvasWidth(virtualWidth);
                setCanvasHeight(Math.floor(virtualWidth * ratio));
            } else {
                setCanvasWidth(1024);
                setCanvasHeight(640);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            playSound('gingerjesus', 0.7);
        } else if (nextChar === "darren") {
            playSound('pushin', 0.7);
        } else if (nextChar === "ryno") {
            playSound('ryno_itstime', 0.7);
        } else if (nextChar === "tymeless") {
            playSound('tymeless_letsgoo', 0.7);
        } else {
            playSound('coin', 0.7);
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
        bgMusic: null as HTMLAudioElement | null,
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

    useEffect(() => {
        if (gameRef.current.bgMusic) {
            gameRef.current.bgMusic.volume = musicVolume;
        }
    }, [musicVolume]);

    const playBackgroundMusic = (path: string) => {
        if (gameRef.current.bgMusic) {
            if (gameRef.current.bgMusic.src.endsWith(path)) {
                if (gameRef.current.bgMusic.paused) {
                    gameRef.current.bgMusic.play().catch(() => {});
                }
                return;
            }
        }
        
        const music = new Audio(path);
        music.loop = true;
        music.volume = musicVolume;
        
        music.play().then(() => {
            // Only pause and switch if the new music actually starts playing
            if (gameRef.current.bgMusic) {
                gameRef.current.bgMusic.pause();
                gameRef.current.bgMusic.src = "";
            }
            gameRef.current.bgMusic = music;
        }).catch((err) => {
            console.warn(`Failed to play music at ${path}:`, err);
            // If it failed to play (e.g. missing file), keep current music playing
            if (gameRef.current.bgMusic && gameRef.current.bgMusic.paused) {
                gameRef.current.bgMusic.play().catch(() => {});
            }
        });
    };

    const applyLevelSettings = (levelId: LevelId) => {
        gameRef.current.timer = levelId === '1-2' ? 233 : 250;
        
        let musicPath = '/music/intro.mp3'; // Use intro.mp3 as fallback for all levels since others were deleted
        
        if (levelId === '1-1' || levelId === '1-1-cave') {
            musicPath = '/music/level1theme.mp3';
        } else if (levelId === '1-2') {
            musicPath = '/music/level2theme.mp3';
        } else if (levelId === '1-3') {
            musicPath = '/music/level3theme.mp3';
        }
        
        playBackgroundMusic(musicPath);
    };

    useEffect(() => {
        if (screen === 'start' || screen === 'select') {
            playBackgroundMusic('/music/intro.mp3');
        } else if (screen === 'tbc') {
            if (gameRef.current.bgMusic) {
                gameRef.current.bgMusic.pause();
            }
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
                playSound('gingerjesus');
            } else if (character === "ryno") {
                playSound('ryno_itstime');
            } else if (character === "tymeless") {
                playSound('tymeless_letsgoo');
            }
            gameRef.current.lives -= 1;
            if (gameRef.current.lives <= 0) {
                setScreen('start');
                return;
            }
            gameRef.current.tiles = getTiles();
            
            let resetLevelId = currentLevelId;
            
            gameRef.current.enemies = getEnemiesForLevel(resetLevelId);
            
            if (resetLevelId === '1-2') {
                gameRef.current.player.x = 8 * TILE;
                gameRef.current.player.y = 2 * TILE;
            } else {
                gameRef.current.player.x = 100;
                gameRef.current.player.y = 400;
            }
            gameRef.current.player.vx = 0;
            gameRef.current.player.vy = 0;
            gameRef.current.player.state = "small";
            applyLevelSettings(resetLevelId);
            gameRef.current.lastTimerUpdate = Date.now();
            
            // Reset dimensions to small state for all characters
            gameRef.current.player.h = 72;
            gameRef.current.player.w = 48;

            // Reset Camera
            camera.x = 0;
            camera.lookAhead = 0;
        };

        let lastTime = performance.now();
        const fpsInterval = 1000 / 60;

        const loop = (currentTime: number) => {
            animationFrameId = requestAnimationFrame(loop);

            const elapsed = currentTime - lastTime;

            if (elapsed > fpsInterval) {
                lastTime = currentTime - (elapsed % fpsInterval);

                const { player, tiles, clouds, scenery, enemies, powerups, coins, keys } = gameRef.current;

                if (gameRef.current.levelTransitionState === 'none') {
                    // Update Player
                    player.update(keys);
                    applyPhysics(player);

                    // Restore music when invincibility ends
                    if (gameRef.current.bgMusic && gameRef.current.bgMusic.src.includes('invincibility.mp3') && !player.isInvincible) {
                        applyLevelSettings(currentLevelId);
                    }

                    // Update Enemies
                    enemies.forEach(e => {
                        // 🚀 PERFORMANCE FIX: Only update enemies near the camera
                        if (e.x - camera.x < -100 || e.x - camera.x > canvas.width + 100) return;

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
                collidePowerUps(player, powerups, () => {
                    playBackgroundMusic('/music/invincibility.mp3');
                }, () => {
                    gameRef.current.lives++;
                    playSound('coin'); 
                });
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
                    // Logic to decide whether to spawn a PowerUp or a Coin
                    let shouldSpawnPowerUp = false;
                    
                    if (t.type === 'question') {
                        // 🌟 Guaranteed PowerUp Locations
                        if (t.x === 15 * TILE && t.y === 9 * TILE) {
                            shouldSpawnPowerUp = true;
                        }
                        // 🌟 Guaranteed Invincibility Mushroom (Ginga Drink)
                        else if (t.x === 22 * TILE && t.y === 5 * TILE && currentLevelId === '1-1') {
                            const p = new PowerUp(t.x, t.y - 20, player.characterId);
                            p.isInvincibilityMushroom = true;
                            gameRef.current.powerups.push(p);
                            return; // Exit early as we've handled this special spawn
                        }
                        // 🎲 Dynamic PowerUp Spawning
                        else if (Math.random() < 0.1) {
                            shouldSpawnPowerUp = true;
                        }
                    }

                    if (shouldSpawnPowerUp) {
                        const isHeart = player.state === 'big';
                        const heartExists = gameRef.current.powerups.some(p => p.isHeart && p.active);
                        if (isHeart && heartExists) {
                            shouldSpawnPowerUp = false; // Heart already exists, don't spawn another
                        } else {
                            gameRef.current.powerups.push(new PowerUp(t.x, t.y - 40, player.characterId, false, isHeart));
                        }
                    }
                    
                    if (!shouldSpawnPowerUp) {
                        // Default to spawning a Coin
                        const vx = (Math.random() - 0.5) * 4;
                        const vy = -12;
                        gameRef.current.coins.push(new Coin(t.x + 12, t.y - 20, vx, vy));
                    }
                });

                // Collect static coins (tiles)
                tiles.forEach(t => {
                    if (t.type === 'coin' && !t.destroyed && rectIntersect(player, t)) {
                        t.destroyed = true;
                        gameRef.current.score += 200;
                        gameRef.current.coinsCollected += 1;
                        if (gameRef.current.coinsCollected >= 100) {
                            gameRef.current.coinsCollected = 0;
                            gameRef.current.lives += 1;
                            playSound('coin'); 
                        } else {
                            playSound('coin');
                        }
                    }
                });

                // Pipe transitions
                if (keys['ArrowDown'] && player.onGround) {
                    // Warp Pipe 1-1 -> Cave
                    if (currentLevelId === '1-1') {
                        const pipeX = 46 * TILE;
                        if (player.x + player.w / 2 > pipeX && player.x + player.w / 2 < pipeX + 2 * TILE) {
                            setCurrentLevel('1-1-cave');
                            reset();
                            player.x = 3 * TILE;
                            player.y = 2 * TILE;
                            playSound('pipe');
                        }
                    }
                    // Exit Pipe Cave -> 1-1
                    else if (currentLevelId === '1-1-cave') {
                        const pipeX = 44 * TILE;
                        if (player.x + player.w / 2 > pipeX && player.x + player.w / 2 < pipeX + 2 * TILE) {
                            setCurrentLevel('1-1');
                            reset();
                            player.x = 46 * TILE;
                            player.y = 10 * TILE - player.h;
                            playSound('pipe');
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
                                    gameRef.current.player.y = 400;
                                }
                                applyLevelSettings(gameRef.current.levelTransitionNextLevel);
                                gameRef.current.levelTransitionState = 'none';
                                gameRef.current.fireworks = [];

                                // Reset Camera
                                camera.x = 0;
                                camera.lookAhead = 0;
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
                updateCamera(player, canvas.width, canvas.height, keys);
            }

            if (player.y > canvas.height + camera.y) reset();

            // Draw
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Background
            if (currentLevelId.includes('cave')) {
                ctx.fillStyle = "#0a0a0a"; // Darker for underground
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else if (currentLevelId === '1-2') {
                // Gym Background: Dark Brick/Industrial
                ctx.fillStyle = "#111"; // Deep black-grey
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw some background brick lines
                ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
                ctx.lineWidth = 1;
                const brickW = 120;
                const brickH = 60;
                for (let x = - (camera.x * 0.2) % brickW; x < canvas.width; x += brickW) {
                    for (let y = 0; y < canvas.height; y += brickH) {
                        ctx.strokeRect(x, y, brickW, brickH);
                    }
                }
            } else {
                // Beautiful Sky Gradient
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, "#2980B9"); // Darker blue top
                gradient.addColorStop(0.6, "#6DD5FA"); // Lighter blue mid
                gradient.addColorStop(1, "#FFFFFF"); // White horizon
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Draw Clouds
            if (!currentLevelId.includes('cave') && currentLevelId !== '1-2') {
                ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                const time = Date.now() / 1000;
                const wrapWidth = 1424; // Matches generation wrap width
                clouds.forEach(c => {
                    let drawX = c.x - (camera.x * c.parallaxSpeed) + (time * c.driftSpeed);
                    let drawY = c.y - camera.y;
                    // Wrap around logic based on drawX
                    drawX = ((drawX % wrapWidth) + wrapWidth) % wrapWidth - 200;
                    
                    ctx.beginPath();
                    for (let p of c.parts) {
                        ctx.arc(drawX + p.cx, drawY + p.cy, p.r, 0, Math.PI * 2);
                    }
                    ctx.fill();
                });
            }

            // Draw Scenery (Plants/Hills)
            if (!currentLevelId.includes('cave') && currentLevelId !== '1-2') {
                scenery.forEach(s => {
                    const drawX = s.x - camera.x;
                    const drawY = s.y - camera.y;
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
                ctx.fillText("PEACOCKS GYM", 249.5 * TILE - camera.x, 3.5 * TILE - camera.y);
            }

            // Draw Tiles
            for (let t of tiles) {
                if (t.destroyed) continue;

                // Culling: Only draw if the tile is within the viewport (with a small buffer)
                if (t.x - camera.x + t.w < -TILE || t.x - camera.x > canvas.width + TILE) continue;

                if (t.type === 'ground' || t.type === 'solid') {
                    const isCave = currentLevelId.includes('cave');
                    const isGym = currentLevelId === '1-2';
                    
                    if (isCave) {
                        ctx.fillStyle = "#2c3e50"; // Dark blue-grey for cave ground
                    } else if (isGym) {
                        ctx.fillStyle = "#1a1a1a"; // Darker Industrial stone for Gym
                    } else {
                        ctx.fillStyle = "#c84c0c"; // Classic 1-1 orange
                    }
                    
                    ctx.fillRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                    
                    // Fill downwards to screen bottom for full-bleed mobile
                    if (isMobile) {
                        ctx.fillRect(t.x - camera.x, t.y - camera.y + t.h, t.w, canvas.height - (t.y - camera.y + t.h) + 100);
                    }
                    
                    // Texture/Details
                    ctx.fillStyle = isGym ? "#333" : (isCave ? "#50eaff" : "#d85c1c");
                    ctx.fillRect(t.x - camera.x + 4, t.y - camera.y + 10, 4, 4);
                    ctx.fillRect(t.x - camera.x + 20, t.y - camera.y + 25, 6, 6);
                    ctx.fillRect(t.x - camera.x + 30, t.y - camera.y + 12, 4, 4);

                    ctx.strokeStyle = isGym ? "#f1c40f80" : "#000000"; // Golden accent for Gym
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                    
                    // Highlight top
                    ctx.fillStyle = isGym ? "#444" : (isCave ? "#adefff" : "#fca044");
                    ctx.fillRect(t.x - camera.x, t.y - camera.y, t.w, 4);
                } else if (t.type === 'brick') {
                    const isCave = currentLevelId.includes('cave');
                    const isGym = currentLevelId === '1-2';
                    
                    if (isGym) {
                        ctx.fillStyle = "#c0392b"; // Red Gym Bricks
                    } else if (isCave) {
                        ctx.fillStyle = "#2c3e50";
                    } else {
                        ctx.fillStyle = "#c84c0c";
                    }
                    
                    ctx.fillRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                    
                    // Brick highlights
                    ctx.fillStyle = isGym ? "#e74c3c" : (isCave ? "#34495e" : "#d85c1c");
                    ctx.fillRect(t.x - camera.x + 2, t.y - camera.y + 2, t.w - 4, 2);
                    
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                    
                    ctx.beginPath();
                    ctx.moveTo(t.x - camera.x, t.y - camera.y + t.h/2);
                    ctx.lineTo(t.x - camera.x + t.w, t.y - camera.y + t.h/2);
                    ctx.moveTo(t.x - camera.x + t.w/2, t.y - camera.y);
                    ctx.lineTo(t.x - camera.x + t.w/2, t.y - camera.y + t.h/2);
                    ctx.moveTo(t.x - camera.x + t.w/4, t.y - camera.y + t.h/2);
                    ctx.lineTo(t.x - camera.x + t.w/4, t.y - camera.y + t.h);
                    ctx.moveTo(t.x - camera.x + t.w*0.75, t.y - camera.y + t.h/2);
                    ctx.lineTo(t.x - camera.x + t.w*0.75, t.y - camera.y + t.h);
                    ctx.stroke();
                } else if (t.type === 'question') {
                    const isCave = currentLevelId === '1-2' || currentLevelId.includes('cave');
                    if (t.used) {
                        ctx.fillStyle = isCave ? "#40deff" : "#c84c0c";
                        ctx.fillRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                        ctx.strokeStyle = "#000000";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                        ctx.fillStyle = "#000000";
                        ctx.fillRect(t.x - camera.x + 4, t.y - camera.y + 4, 6, 6);
                    } else {
                        ctx.fillStyle = "#fca044";
                        ctx.fillRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                        ctx.strokeStyle = "#000000";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                        // 4 corner dots
                        ctx.fillStyle = "#c84c0c";
                        ctx.fillRect(t.x - camera.x + 4, t.y - camera.y + 4, 4, 4);
                        ctx.fillRect(t.x - camera.x + t.w - 8, t.y - camera.y + 4, 4, 4);
                        ctx.fillRect(t.x - camera.x + 4, t.y - camera.y + t.h - 8, 4, 4);
                        ctx.fillRect(t.x - camera.x + t.w - 8, t.y - camera.y + t.h - 8, 4, 4);
                        // The ?
                        ctx.fillStyle = "#c84c0c";
                        ctx.font = "bold 20px monospace";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText("?", t.x - camera.x + t.w/2, t.y - camera.y + t.h/2 + 2);
                    }
                } else if (t.type === 'solid') {
                    const isCave = currentLevelId === '1-2' || currentLevelId.includes('cave');
                    ctx.fillStyle = isCave ? "#40deff" : "#c84c0c";
                    ctx.fillRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                    ctx.fillStyle = isCave ? "#adefff" : "#fca044";
                    ctx.fillRect(t.x - camera.x + 4, t.y - camera.y + 4, 6, 6);
                } else if (t.type === 'pipe') {
                    ctx.fillStyle = "#00a800";
                    ctx.fillRect(t.x - camera.x, t.y - camera.y, t.isLeft ? t.w + 1 : t.w, isMobile ? canvas.height - (t.y - camera.y) + 100 : t.h);
                    
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    if (t.isLeft) {
                        ctx.moveTo(t.x - camera.x, t.y - camera.y);
                        ctx.lineTo(t.x - camera.x, t.y - camera.y + t.h);
                    } else {
                        ctx.moveTo(t.x - camera.x + t.w, t.y - camera.y);
                        ctx.lineTo(t.x - camera.x + t.w, t.y - camera.y + t.h);
                    }
                    ctx.stroke();

                    if (t.isLeft) {
                        ctx.fillStyle = "#80d010";
                        ctx.fillRect(t.x - camera.x + 4, t.y - camera.y, 4, t.h);
                        ctx.fillRect(t.x - camera.x + 12, t.y - camera.y, 2, t.h);
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
                        ctx.fillRect(capX, t.y - camera.y, capW, 24);
                        
                        ctx.beginPath();
                        // Top edge
                        ctx.moveTo(capX, t.y - camera.y);
                        ctx.lineTo(capX + capW, t.y - camera.y);
                        // Bottom edge
                        ctx.moveTo(capX, t.y - camera.y + 24);
                        ctx.lineTo(capX + capW, t.y - camera.y + 24);
                        // Side edge
                        if (t.isLeft) {
                            ctx.moveTo(capX, t.y - camera.y);
                            ctx.lineTo(capX, t.y - camera.y + 24);
                        } else {
                            ctx.moveTo(capX + capW, t.y - camera.y);
                            ctx.lineTo(capX + capW, t.y - camera.y + 24);
                        }
                        ctx.stroke();

                        if (t.isLeft) {
                            ctx.fillStyle = "#80d010";
                            ctx.fillRect(capX + 8, t.y - camera.y + 2, 4, 20);
                            ctx.fillRect(capX + 16, t.y - camera.y + 2, 2, 20);
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
                        ctx.fillRect(capX, capY - camera.y, capW, 24);
                        
                        ctx.beginPath();
                        // Top edge
                        ctx.moveTo(capX, capY - camera.y);
                        ctx.lineTo(capX + capW, capY - camera.y);
                        // Bottom edge
                        ctx.moveTo(capX, capY - camera.y + 24);
                        ctx.lineTo(capX + capW, capY - camera.y + 24);
                        // Side edge
                        if (t.isLeft) {
                            ctx.moveTo(capX, capY - camera.y);
                            ctx.lineTo(capX, capY - camera.y + 24);
                        } else {
                            ctx.moveTo(capX + capW, capY - camera.y);
                            ctx.lineTo(capX + capW, capY - camera.y + 24);
                        }
                        ctx.stroke();

                        if (t.isLeft) {
                            ctx.fillStyle = "#80d010";
                            ctx.fillRect(capX + 8, capY - camera.y + 2, 4, 20);
                            ctx.fillRect(capX + 16, capY - camera.y + 2, 2, 20);
                        }
                    }

                } else if (t.type === 'flagpole') {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(t.x - camera.x + 12, t.y - camera.y, 8, t.h);
                    if (t.isTop) {
                        ctx.fillStyle = "#00a800";
                        ctx.beginPath();
                        ctx.arc(t.x - camera.x + 16, t.y - camera.y, 10, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(t.x - camera.x - 16, t.y - camera.y + 10, 28, 20);
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
                        ctx.fillRect(t.x - camera.x, t.y - camera.y, t.w, t.h);
                        
                        // Brick Grid lines
                        ctx.strokeStyle = "#000";
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        // Horizontal middle
                        ctx.moveTo(t.x - camera.x, t.y - camera.y + t.h/2);
                        ctx.lineTo(t.x - camera.x + t.w, t.y - camera.y + t.h/2);
                        // Vertical lines for brick pattern
                        ctx.moveTo(t.x - camera.x + t.w/2, t.y - camera.y);
                        ctx.lineTo(t.x - camera.x + t.w/2, t.y - camera.y + t.h/2);
                        ctx.moveTo(t.x - camera.x + t.w/4, t.y - camera.y + t.h/2);
                        ctx.lineTo(t.x - camera.x + t.w/4, t.y - camera.y + t.h);
                        ctx.moveTo(t.x - camera.x + t.w*0.75, t.y - camera.y + t.h/2);
                        ctx.lineTo(t.x - camera.x + t.w*0.75, t.y - camera.y + t.h);
                        ctx.stroke();

                        // Battlements
                        const drawBattlements = () => {
                            const bW = t.w / 4;
                            const bH = 10;
                            for (let i = 0; i < 2; i++) {
                                const bx = t.x - camera.x + (i * 2 + 0.5) * bW;
                                const by = t.y - camera.y - bH;
                                ctx.fillStyle = "#c84c0c";
                                ctx.fillRect(bx, by, bW, bH);
                                ctx.strokeStyle = "#000";
                                ctx.strokeRect(bx, by, bW, bH);
                                // Highlight line
                                ctx.fillStyle = "#fca044";
                                ctx.fillRect(bx, by, bW, 2);
                            }
                        };
                        
                        if (relY === 0 && relX >= 1 && relX <= 3) drawBattlements();
                        if (relY === 2 && (relX === 0 || relX === 4)) drawBattlements();

                        // Door (Centered in base)
                        if (relX === 2 && relY >= 3) {
                            ctx.fillStyle = "#000";
                            ctx.fillRect(t.x - camera.x + 5, t.y - camera.y, t.w - 10, t.h);
                            if (relY === 3) {
                                // Arched entrance
                                ctx.beginPath();
                                ctx.arc(t.x - camera.x + t.w/2, t.y - camera.y + 10, t.w/2 - 5, Math.PI, 0);
                                ctx.fill();
                            }
                        }
                        
                        // Windows (Slits in top part)
                        if (relX === 2 && relY === 0) {
                            ctx.fillStyle = "#000";
                            ctx.fillRect(t.x - camera.x + 8, t.y - camera.y + 15, 6, 15);
                            ctx.fillRect(t.x - camera.x + 26, t.y - camera.y + 15, 6, 15);
                        }
                    }
                } else if (t.type === 'coin') {
                    const drawX = t.x - camera.x;
                    const drawY = t.y - camera.y;
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
                if (m.x - camera.x + m.w > 0 && m.x - camera.x < canvas.width) m.draw(ctx, camera.x, camera.y);
            });
            coins.forEach(c => {
                if (c.x - camera.x + c.w > 0 && c.x - camera.x < canvas.width) c.draw(ctx, camera.x, camera.y);
            });
            enemies.forEach(e => {
                if (e.x - camera.x + e.w > 0 && e.x - camera.x < canvas.width) e.draw(ctx, camera.x, camera.y);
            });
            
            // Hide player when walking into the castle door
            const isEnteringCastle = gameRef.current.levelTransitionState === 'walking' && player.x >= (currentLevelId === '1-2' ? 247 * TILE : 203.8 * TILE);
            if (!isEnteringCastle) {
                player.draw(ctx, camera.x, camera.y);
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
            const hudScale = isMobile ? 0.7 : 1.0;
            ctx.fillStyle = "white";
            ctx.font = `bold ${Math.floor(24 * hudScale)}px monospace`;
            ctx.textAlign = "left";
            ctx.fillText("SCORE", 20 * hudScale, 40 * hudScale);
            ctx.fillText(gameRef.current.score.toString().padStart(6, '0'), 20 * hudScale, 65 * hudScale);
            
            ctx.textAlign = "center";
            ctx.fillText(`COINS ${gameRef.current.coinsCollected.toString().padStart(2, '0')}`, canvas.width / 2, 40 * hudScale);
            ctx.fillText(`LIVES ${gameRef.current.lives}`, canvas.width / 2, 65 * hudScale);
            ctx.font = `bold ${Math.floor(18 * hudScale)}px monospace`;
            ctx.fillText(`WORLD ${currentLevelId.toUpperCase()}`, canvas.width / 2, 90 * hudScale);
            
            ctx.textAlign = "right";
            ctx.font = `bold ${Math.floor(24 * hudScale)}px monospace`;
            ctx.fillText("TIME", canvas.width - 20 * hudScale, 40 * hudScale);
            ctx.fillText(Math.floor(gameRef.current.timer).toString().padStart(3, '0'), canvas.width - 20 * hudScale, 65 * hudScale);

            if (gameRef.current.combo > 1) {
                ctx.fillStyle = "#F1C40F";
                ctx.textAlign = "center";
                ctx.fillText(`COMBO x ${gameRef.current.combo}`, canvas.width / 2, 120 * hudScale);
            }
            }
        };

        loop();
        return () => cancelAnimationFrame(animationFrameId);
    }, [running]);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#000]">
            {screen === 'start' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                    <div 
                        className="relative w-full h-full"
                        style={{ 
                            backgroundImage: `url('${isMobile ? '/screens/start_screen_mob.png' : '/screens/start_screen.png'}')`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated',
                            aspectRatio: isMobile ? '2 / 3' : '16 / 9',
                            maxHeight: '100%',
                            maxWidth: '100%'
                        }}
                    >
                        {/* Invisible button sitting over the baked-in box */}
                        <button 
                            onClick={() => {
                                playBackgroundMusic('/music/intro.mp3');
                                setScreen('select');
                            }}
                            className="cursor-pointer bg-transparent border-none outline-none focus:outline-none absolute"
                            style={{
                                top: isMobile ? '30.5%' : '32.2%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: isMobile ? '45%' : '28.5%',
                                height: isMobile ? '11%' : '20.5%'
                            }}
                            title="Start Engine"
                        />

                        {/* Ginger Jay Easter Egg */}
                        <button 
                            onClick={triggerGingerJayEasterEgg}
                            className="absolute cursor-pointer bg-transparent border-none outline-none focus:outline-none"
                            style={{
                                top: isMobile ? '42.5%' : '45%',
                                left: isMobile ? '28.5%' : '23%',
                                transform: 'translate(-50%, -50%)',
                                width: isMobile ? '15%' : '12%',
                                height: isMobile ? '15%' : '30%',
                            }}
                            title="Ginger Jay"
                        />
                    </div>
                </div>
            )}
            
            {screen === 'select' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                    <div 
                        className="relative w-full h-full bg-[#333] overflow-hidden" 
                        style={{ 
                            imageRendering: 'pixelated',
                            aspectRatio: isMobile ? '800 / 1000' : '1024 / 640',
                            maxHeight: '100%',
                            maxWidth: '100%'
                        }}
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
                        {/* Brick Wall Background Pattern */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                            backgroundImage: `
                                linear-gradient(90deg, #000 2px, transparent 2px),
                                linear-gradient(0deg, #000 2px, transparent 2px)
                            `,
                            backgroundSize: '64px 32px'
                        }}></div>

                        {/* Peacock Gymnasium Text on Wall */}
                        <div className="absolute top-[13%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-40 flex flex-col items-center">
                            <span className="text-6xl font-black text-white tracking-[0.2em] uppercase leading-none [text-shadow:2px_2px_0_#000]">Peacock</span>
                            <span className="text-4xl font-bold text-white tracking-[0.1em] uppercase [text-shadow:1px_1px_0_#000]">Gymnasium</span>
                        </div>

                        {/* Gym Equipment - Dumbbells */}
                        <div className="absolute top-[15%] left-[5%] w-12 h-4 bg-gray-600 border-2 border-black z-10 flex items-center justify-between px-1">
                            <div className="w-2 h-6 bg-black"></div>
                            <div className="w-2 h-6 bg-black"></div>
                        </div>
                        <div className="absolute top-[20%] left-[8%] w-12 h-4 bg-gray-600 border-2 border-black z-10 flex items-center justify-between px-1 rotate-12">
                            <div className="w-2 h-6 bg-black"></div>
                            <div className="w-2 h-6 bg-black"></div>
                        </div>

                        {/* Gym Equipment - Weight Rack */}
                        <div className="absolute bottom-[10%] left-[2%] w-24 h-32 border-x-4 border-black z-10 flex flex-col justify-around items-center">
                            <div className="w-20 h-4 bg-gray-700 border-2 border-black"></div>
                            <div className="w-16 h-4 bg-gray-700 border-2 border-black"></div>
                            <div className="w-12 h-4 bg-gray-700 border-2 border-black"></div>
                        </div>

                        {/* Gym Equipment - Bench Press (Simple) */}
                        <div className="absolute bottom-[10%] right-[5%] w-32 h-16 z-10">
                            <div className="absolute bottom-0 left-0 w-full h-4 bg-red-800 border-2 border-black"></div>
                            <div className="absolute bottom-4 left-4 w-2 h-12 bg-gray-800 border-2 border-black"></div>
                            <div className="absolute bottom-4 right-4 w-2 h-12 bg-gray-800 border-2 border-black"></div>
                            <div className="absolute top-0 left-0 w-full h-2 bg-gray-400 border border-black"></div>
                        </div>

                        {/* Gym Poster */}
                        <div className="absolute top-[20%] right-[10%] w-16 h-24 bg-white/10 border-2 border-white/20 z-0 flex flex-col items-center p-1">
                            <div className="w-full h-1/2 bg-white/20 mb-1"></div>
                            <div className="w-full h-1 bg-white/20 mb-1"></div>
                            <div className="w-2/3 h-1 bg-white/20"></div>
                        </div>

                        {/* Decorative Floating Bricks & Question Blocks */}
                        <div className="hidden md:flex absolute top-4 left-4 w-16 h-16 bg-[#c84c0c] border-4 border-black shadow-[4px_4px_0_#000] flex-col z-20">
                            <div className="h-1/2 border-b-4 border-black flex"><div className="w-1/2 border-r-4 border-black"></div></div>
                            <div className="h-1/2 flex"><div className="w-1/4 border-r-4 border-black"></div><div className="w-1/2 border-r-4 border-black"></div></div>
                        </div>
                        
                        <div className="hidden md:flex absolute top-4 right-4 w-16 h-16 bg-[#c84c0c] border-4 border-black shadow-[4px_4px_0_#000] flex-col z-20">
                            <div className="h-1/2 border-b-4 border-black flex"><div className="w-1/2 border-r-4 border-black"></div></div>
                            <div className="h-1/2 flex"><div className="w-1/4 border-r-4 border-black"></div><div className="w-1/2 border-r-4 border-black"></div></div>
                        </div>

                        {/* Brick Floor */}
                        <div className="hidden md:flex absolute bottom-0 left-0 w-full h-16 bg-[#c84c0c] border-t-8 border-black z-20">
                            {Array.from({ length: 16 }).map((_, i) => (
                                <div key={i} className="flex-1 border-r-4 border-black flex flex-col">
                                    <div className="h-1/2 border-b-4 border-black"></div>
                                </div>
                            ))}
                        </div>

                        <h1 className="hidden md:block absolute top-8 left-1/2 -translate-x-1/2 text-5xl font-bold text-white [text-shadow:4px_4px_0_#000] whitespace-nowrap z-30 uppercase tracking-widest">Select Character</h1>
                        
                        {/* Volume Control */}
                        <div className="hidden md:flex absolute top-4 right-24 z-50 items-center gap-2 bg-black/50 p-2 border-2 border-white/20 rounded">
                            <span className="text-white text-xs font-bold uppercase">Music</span>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                value={musicVolume} 
                                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                            />
                        </div>
                        
                        {/* Buttons positioned in a 3x3 grid */}
                        <div className="hidden md:grid grid-cols-3 grid-rows-3 gap-6 absolute top-[18%] left-1/2 -translate-x-1/2 w-[85%] h-[65%] max-w-4xl z-30">
                            <button 
                                onClick={() => {
                                    setCharacter("ginja");
                                    playSound('gingerjesus', 0.7);
                                }}
                                className={`relative border-4 flex flex-col items-center justify-center p-4 transition-all ${character === "ginja" ? "border-yellow-400 bg-white/20 scale-110 z-40 shadow-[8px_8px_0_rgba(0,0,0,0.5)]" : "border-black/40 bg-black/30 hover:border-white/50 hover:bg-black/40"}`}
                            >
                                {character === "ginja" && <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 border-4 border-black animate-bounce flex items-center justify-center text-black font-bold">!</div>}
                                <img 
                                    src={character === "ginja" ? "/motion/gingerjay/powerup1.png" : "/motion/gingerjay/walk1.png"} 
                                    alt="Ginger Jay" 
                                    className="h-[70%] object-contain mb-2" 
                                    style={{ imageRendering: 'pixelated' }} 
                                />
                                <span className="text-white font-bold text-lg [text-shadow:2px_2px_0_#000] uppercase">Ginger Jay</span>
                            </button>
                            <button 
                                onClick={() => {
                                    setCharacter("darren");
                                    playSound('pushin', 0.7);
                                }}
                                className={`relative border-4 flex flex-col items-center justify-center p-4 transition-all ${character === "darren" ? "border-yellow-400 bg-white/20 scale-110 z-40 shadow-[8px_8px_0_rgba(0,0,0,0.5)]" : "border-black/40 bg-black/30 hover:border-white/50 hover:bg-black/40"}`}
                            >
                                {character === "darren" && <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 border-4 border-black animate-bounce flex items-center justify-center text-black font-bold">!</div>}
                                <img 
                                    src={character === "darren" ? "/motion/darren/powerup1.png" : "/motion/darren/walk1.png"} 
                                    alt="Darren" 
                                    className="h-[70%] object-contain mb-2" 
                                    style={{ imageRendering: 'pixelated' }} 
                                />
                                <span className="text-white font-bold text-lg [text-shadow:2px_2px_0_#000] uppercase">Darren</span>
                            </button>
                            <button 
                                onClick={() => {
                                    setCharacter("passive");
                                    playSound('coin', 0.7);
                                }}
                                className={`relative border-4 flex flex-col items-center justify-center p-4 transition-all ${character === "passive" ? "border-yellow-400 bg-white/20 scale-110 z-40 shadow-[8px_8px_0_rgba(0,0,0,0.5)]" : "border-black/40 bg-black/30 hover:border-white/50 hover:bg-black/40"}`}
                            >
                                {character === "passive" && <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 border-4 border-black animate-bounce flex items-center justify-center text-black font-bold">!</div>}
                                <img 
                                    src={character === "passive" ? "/motion/passive/powerup1.png" : "/motion/passive/walk1.png"} 
                                    alt="Passive" 
                                    className="h-[70%] object-contain mb-2" 
                                    style={{ imageRendering: 'pixelated' }} 
                                />
                                <span className="text-white font-bold text-lg [text-shadow:2px_2px_0_#000] uppercase">Passive</span>
                            </button>
                            <button 
                                onClick={() => {
                                    setCharacter("tymeless");
                                    playSound('tymeless_letsgoo', 0.7);
                                }}
                                className={`relative border-4 flex flex-col items-center justify-center p-4 transition-all ${character === "tymeless" ? "border-yellow-400 bg-white/20 scale-110 z-40 shadow-[8px_8px_0_rgba(0,0,0,0.5)]" : "border-black/40 bg-black/30 hover:border-white/50 hover:bg-black/40"}`}
                            >
                                {character === "tymeless" && <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 border-4 border-black animate-bounce flex items-center justify-center text-black font-bold">!</div>}
                                <img 
                                    src={character === "tymeless" ? "/motion/tymeless/powerup1.png" : "/motion/tymeless/walk1.png"} 
                                    alt="Tymeless" 
                                    className="h-[70%] object-contain mb-2" 
                                    style={{ imageRendering: 'pixelated' }} 
                                />
                                <span className="text-white font-bold text-lg [text-shadow:2px_2px_0_#000] uppercase">Tymeless</span>
                            </button>
                            <button 
                                onClick={() => {
                                    setCharacter("deeno");
                                    playSound('coin', 0.7);
                                }}
                                className={`relative border-4 flex flex-col items-center justify-center p-4 transition-all ${character === "deeno" ? "border-yellow-400 bg-white/20 scale-110 z-40 shadow-[8px_8px_0_rgba(0,0,0,0.5)]" : "border-black/40 bg-black/30 hover:border-white/50 hover:bg-black/40"}`}
                            >
                                {character === "deeno" && <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 border-4 border-black animate-bounce flex items-center justify-center text-black font-bold">!</div>}
                                <img 
                                    src={character === "deeno" ? "/motion/deeno/powerup1.png" : "/motion/deeno/walk1.png"} 
                                    alt="Deeno" 
                                    className="h-[70%] object-contain mb-2" 
                                    style={{ imageRendering: 'pixelated' }} 
                                />
                                <span className="text-white font-bold text-lg [text-shadow:2px_2px_0_#000] uppercase">Deeno</span>
                            </button>
                            <button 
                                onClick={() => {
                                    setCharacter("ryno");
                                    playSound('ryno_itstime', 0.7);
                                }}
                                className={`relative border-4 flex flex-col items-center justify-center p-4 transition-all ${character === "ryno" ? "border-yellow-400 bg-white/20 scale-110 z-40 shadow-[8px_8px_0_rgba(0,0,0,0.5)]" : "border-black/40 bg-black/30 hover:border-white/50 hover:bg-black/40"}`}
                            >
                                {character === "ryno" && <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 border-4 border-black animate-bounce flex items-center justify-center text-black font-bold">!</div>}
                                <img 
                                    src={character === "ryno" ? "/motion/ryno/powerup1.png" : "/motion/ryno/walk1.png"} 
                                    alt="Ryno" 
                                    className="h-[70%] object-contain mb-2" 
                                    style={{ imageRendering: 'pixelated' }} 
                                />
                                <span className="text-white font-bold text-lg [text-shadow:2px_2px_0_#000] uppercase">Ryno</span>
                            </button>
                            <button 
                                onClick={() => {
                                    setCharacter("roman");
                                    playSound('coin', 0.7);
                                }}
                                className={`relative border-4 flex flex-col items-center justify-center p-4 transition-all ${character === "roman" ? "border-yellow-400 bg-white/20 scale-110 z-40 shadow-[8px_8px_0_rgba(0,0,0,0.5)]" : "border-black/40 bg-black/30 hover:border-white/50 hover:bg-black/40"}`}
                            >
                                {character === "roman" && <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 border-4 border-black animate-bounce flex items-center justify-center text-black font-bold">!</div>}
                                <img 
                                    src={character === "roman" ? "/motion/Roman/powerup1.png" : "/motion/Roman/walk1.png"} 
                                    alt="Roman" 
                                    className={`h-[70%] object-contain mb-2`} 
                                    style={{ imageRendering: 'pixelated' }} 
                                />
                                <span className="text-white font-bold text-lg [text-shadow:2px_2px_0_#000] uppercase">Roman</span>
                            </button>
                            <button 
                                onClick={() => {
                                    setCharacter("tapped24");
                                    playSound('coin', 0.7);
                                }}
                                className={`relative border-4 flex flex-col items-center justify-center p-4 transition-all ${character === "tapped24" ? "border-yellow-400 bg-white/20 scale-110 z-40 shadow-[8px_8px_0_rgba(0,0,0,0.5)]" : "border-black/40 bg-black/30 hover:border-white/50 hover:bg-black/40"}`}
                            >
                                {character === "tapped24" && <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 border-4 border-black animate-bounce flex items-center justify-center text-black font-bold">!</div>}
                                <img 
                                    src={character === "tapped24" ? "/motion/tapped24/powerup1.png" : "/motion/tapped24/walk1.png"} 
                                    alt="Tapped24" 
                                    className={`h-[70%] object-contain mb-2`} 
                                    style={{ imageRendering: 'pixelated' }} 
                                />
                                <span className="text-white font-bold text-lg [text-shadow:2px_2px_0_#000] uppercase">Tapped24</span>
                            </button>
                            <button 
                                onClick={() => {
                                    setCharacter("grams");
                                    playSound('coin', 0.7);
                                }}
                                className={`relative border-4 flex flex-col items-center justify-center p-4 transition-all ${character === "grams" ? "border-yellow-400 bg-white/20 scale-110 z-40 shadow-[8px_8px_0_rgba(0,0,0,0.5)]" : "border-black/40 bg-black/30 hover:border-white/50 hover:bg-black/40"}`}
                            >
                                {character === "grams" && <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 border-4 border-black animate-bounce flex items-center justify-center text-black font-bold">!</div>}
                                <img 
                                    src={character === "grams" ? "/motion/grams/powerup1.png" : "/motion/grams/walk1.png"} 
                                    alt="Grams" 
                                    className={`h-[70%] object-contain mb-2`} 
                                    style={{ imageRendering: 'pixelated' }} 
                                />
                                <span className="text-white font-bold text-lg [text-shadow:2px_2px_0_#000] uppercase">Grams</span>
                            </button>
                        </div>
                        <div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-white w-full">
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
                                    if (character === "darren") {
                                        gameRef.current.player = new DarrenPlayer();
                                    } else if (character === "passive") {
                                        gameRef.current.player = new PassivePlayer();
                                    } else if (character === "tymeless") {
                                        gameRef.current.player = new TymelessPlayer();
                                    } else if (character === "deeno") {
                                        gameRef.current.player = new DeenoPlayer();
                                    } else if (character === "ryno") {
                                        gameRef.current.player = new RynoPlayer();
                                    } else if (character === "roman") {
                                        gameRef.current.player = new RomanPlayer();
                                    } else if (character === "tapped24") {
                                        gameRef.current.player = new Tapped24Player();
                                    } else if (character === "grams") {
                                        gameRef.current.player = new GramsPlayer();
                                    } else {
                                        gameRef.current.player = new Player();
                                        if (character === "ginja") {
                                            playSound('ohgosh');
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
                                    
                                    // Reset Camera
                                    camera.x = 0;
                                    camera.lookAhead = 0;

                                    setScreen('game');
                                }}
                                className="px-10 py-5 text-xl bg-[#c84c0c] text-white border-4 border-white font-bold cursor-pointer hover:bg-[#a03c0a] transition-colors"
                            >
                                START ENGINE
                            </button>
                        </div>

                        <div className="md:hidden absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#333] overflow-hidden">
                            {/* Brick Wall Background Pattern */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                                backgroundImage: `
                                    linear-gradient(90deg, #000 2px, transparent 2px),
                                    linear-gradient(0deg, #000 2px, transparent 2px)
                                `,
                                backgroundSize: '64px 32px'
                            }}></div>

                            {/* Peacock Gymnasium Text on Wall (Mobile) */}
                            <div className="absolute top-[5%] left-1/2 -translate-x-1/2 pointer-events-none z-0 opacity-30 flex flex-col items-center">
                                <span className="text-3xl font-black text-white tracking-widest uppercase leading-none [text-shadow:1px_1px_0_#000]">Peacock</span>
                                <span className="text-xl font-bold text-white tracking-wider uppercase [text-shadow:1px_1px_0_#000]">Gymnasium</span>
                            </div>

                            {/* Mobile Volume Control */}
                            <div className="absolute top-2 right-2 z-50 flex items-center gap-2 bg-black/50 p-1 border border-white/20 rounded">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value={musicVolume} 
                                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                    className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                                />
                            </div>

                            {/* Brick Floor */}
                            <div className="absolute bottom-0 left-0 w-full h-8 bg-[#c84c0c] border-t-2 border-black flex">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="flex-1 border-r border-black flex flex-col">
                                        <div className="h-1/2 border-b border-black"></div>
                                    </div>
                                ))}
                            </div>

                            {/* 3x3 Grid for Mobile */}
                            <div className={`grid grid-cols-3 gap-2 w-full max-w-sm overflow-y-auto ${isMobile ? 'max-h-[50vh]' : 'h-[60%]'}`}>
                                {[
                                    { id: "ginja", name: "Ginger Jay", img: "/motion/gingerjay/powerup1.png" },
                                    { id: "darren", name: "Darren", img: "/motion/darren/powerup1.png" },
                                    { id: "passive", name: "Passive", img: "/motion/passive/powerup1.png" },
                                    { id: "tymeless", name: "Tymeless", img: "/motion/tymeless/powerup1.png" },
                                    { id: "deeno", name: "Deeno", img: "/motion/deeno/powerup1.png" },
                                    { id: "ryno", name: "Ryno", img: "/motion/ryno/powerup1.png" },
                                    { id: "roman", name: "Roman", img: "/motion/Roman/powerup1.png" },
                                    { id: "tapped24", name: "Tapped24", img: "/motion/tapped24/powerup1.png" },
                                    { id: "grams", name: "Grams", img: "/motion/grams/powerup1.png" },
                                ].map((char) => (
                                    <button 
                                        key={char.id}
                                        onClick={() => {
                                            setCharacter(char.id);
                                            if (char.id === 'ginja') playSound('gingerjesus', 0.7);
                                            else if (char.id === 'darren') playSound('pushin', 0.7);
                                            else if (char.id === 'ryno') playSound('ryno_itstime', 0.7);
                                            else if (char.id === 'tymeless') playSound('tymeless_letsgoo', 0.7);
                                            else playSound('coin', 0.7);
                                        }}
                                        className={`border flex flex-col items-center justify-center p-1 transition-all rounded ${character === char.id ? "border-yellow-400 bg-yellow-400/20 scale-105" : "border-white/20 bg-black/20 hover:border-white/50"}`}
                                    >
                                        <img 
                                            src={character === char.id ? char.img : char.img.replace('powerup1.png', 'walk1.png')} 
                                            alt={char.name} 
                                            className={`${isMobile ? 'h-16' : 'h-24'} object-contain`} 
                                            style={{ imageRendering: 'pixelated' }} 
                                        />
                                        <span className="text-white font-bold text-[9px] uppercase truncate w-full text-center">{char.name}</span>
                                    </button>
                                ))}
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
                                    playBackgroundMusic(startLevel === '1-1' || startLevel === '1-1-cave' ? '/music/level1theme.mp3' : '/music/intro.mp3');
                                    playSound('jump', 0.7);
                                    setCurrentLevel(startLevel);
                                        
                                        // Initialize new player
                                        if (character === "darren") {
                                            gameRef.current.player = new DarrenPlayer();
                                        } else if (character === "passive") {
                                            gameRef.current.player = new PassivePlayer();
                                        } else if (character === "tymeless") {
                                            gameRef.current.player = new TymelessPlayer();
                                            playSound('tymeless_letsgoo', 0.7);
                                        } else if (character === "deeno") {
                                            gameRef.current.player = new DeenoPlayer();
                                        } else if (character === "ryno") {
                                            gameRef.current.player = new RynoPlayer();
                                            playSound('ryno_itstime', 0.7);
                                        } else if (character === "roman") {
                                            gameRef.current.player = new RomanPlayer();
                                        } else if (character === "tapped24") {
                                            gameRef.current.player = new Tapped24Player();
                                        } else if (character === "grams") {
                                            gameRef.current.player = new GramsPlayer();
                                        } else {
                                            gameRef.current.player = new Player();
                                            if (character === "ginja") {
                                                playSound('ohgosh', 0.7);
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
                                        
                                        // Reset Camera
                                        camera.x = 0;
                                        camera.lookAhead = 0;

                                        setScreen('game');
                                    }}
                                    className="px-6 py-3 text-sm bg-[#c84c0c] text-white border-2 border-white font-bold cursor-pointer hover:bg-[#a03c0a] transition-colors animate-pulse"
                                >
                                    PRESS A TO START
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className={`flex-1 flex items-center justify-center w-full h-full relative pointer-events-none`}>
                <canvas 
                    ref={canvasRef} 
                    width={canvasWidth} 
                    height={canvasHeight} 
                    style={{ 
                        imageRendering: 'pixelated',
                        height: '100%',
                        width: '100%',
                        objectFit: isMobile ? 'cover' : 'contain'
                    }}
                    className={`block pointer-events-auto ${(currentLevelId.includes('cave') || currentLevelId === '1-2') && camera.x < 225 * TILE ? 'bg-[#000]' : 'bg-[#5C94FC]'}`} 
                />
            </div>
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

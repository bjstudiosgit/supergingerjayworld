import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../game/players/Player';
import { DarrenPlayer } from '../game/players/darren';
import { PassivePlayer } from '../game/players/PassivePlayer';
import { TymelessPlayer } from '../game/players/TymelessPlayer';
import { DeenoPlayer } from '../game/players/deenoplayer';
import { RynoPlayer } from '../game/players/rynoplayer';
import { RomanPlayer } from '../game/players/romanplayer';
import { GramsPlayer } from '../game/players/gramsplayer';
import { Enemy, Bouncer, Cookie, Walker } from '../game/Enemy';
import { PowerUp } from '../game/PowerUp';
import { Coin } from '../game/Coin';
import { getTiles, getClouds, getScenery, setCurrentLevel, currentLevelId, LevelId } from '../game/Level';
import { TILE } from '../game/Constants';
import { applyPhysics } from '../game/Physics';
import { collideTiles, collideEnemies, collidePowerUps } from '../game/Collision';
import { camera, getMobileCameraY, updateCamera } from '../game/Camera';
import { playSound } from '../game/Sound';
import { triggerGingerJayEasterEgg } from '../game/eastereggs';
import { rectIntersect } from '../game/Collision';
import { EnemyEntity } from '../game/Types';
import { MobileControls } from './MobileControls';
import { entranceX as caveEntranceX, exitPipeX as caveExitPipeX, width as caveWidth } from '../game/levels/Level1_1_Cave';

const IS_DEV = (import.meta as unknown as { env: { DEV: boolean } }).env.DEV;
const CHECKPOINT_X: Partial<Record<LevelId, number>> = {
    '1-1': 102 * TILE, '1-2': 132 * TILE, '1-3': 124 * TILE
};

type FireworkParticle = {
    x: number;
    y: number;
    previousX: number;
    previousY: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    twinkle: number;
};

type FireworkBurst = {
    x: number;
    y: number;
    timer: number;
    ringColor: string;
    particles: FireworkParticle[];
};

const FIREWORK_PALETTES = [
    ['#fff6b0', '#ffd23f', '#ff7b00', '#ff334f'],
    ['#ffffff', '#74f9ff', '#20a4ff', '#7657ff'],
    ['#ffffff', '#ff8ce8', '#ff3ca6', '#ff4f68'],
    ['#efffb0', '#8cff5a', '#26e6c8', '#ffffff']
];

const getEnemiesForLevel = (levelId: LevelId): EnemyEntity[] => {
    if (levelId === '1-1') {
        return [
            new Enemy(22 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(42 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(52 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(93 * TILE, 8 * TILE, "MARGS", "#8E44AD"),
            new Enemy(96 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(110 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(136 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Enemy(170 * TILE, 13 * TILE, "MARGS", "#8E44AD")
        ];
    } else if (levelId === '1-2') {
        return [
            new Cookie(55 * TILE, 13 * TILE),
            new Cookie(80 * TILE, 13 * TILE),
            new Cookie(105 * TILE, 13 * TILE),
            new Walker(125 * TILE, 13 * TILE),
            new Walker(140 * TILE, 13 * TILE),
            new Cookie(154 * TILE, 13 * TILE),
            new Walker(169 * TILE, 13 * TILE),
            new Cookie(182 * TILE, 13 * TILE),
            new Walker(194 * TILE, 13 * TILE),
            new Walker(178 * TILE, 6 * TILE - 32),
            new Cookie(192 * TILE, 6 * TILE - 32),
            new Walker(204 * TILE, 13 * TILE),
            new Cookie(214 * TILE, 13 * TILE),
        ];
    } else if (levelId === '1-3') {
        return [
            new Walker(12 * TILE, 13 * TILE),
            new Enemy(24 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Cookie(36 * TILE, 9 * TILE),
            new Enemy(48 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Cookie(56 * TILE, 9 * TILE),
            new Walker(68 * TILE, 13 * TILE),
            new Enemy(72 * TILE, 5 * TILE, "MARGS", "#8E44AD"),
            new Walker(88 * TILE, 13 * TILE),
            new Cookie(106 * TILE, 8 * TILE),
            new Walker(112 * TILE, 13 * TILE),
            new Cookie(116 * TILE, 3 * TILE),
            new Enemy(128 * TILE, 13 * TILE, "MARGS", "#8E44AD"),
            new Cookie(136 * TILE, 6 * TILE),
            new Walker(150 * TILE, 13 * TILE),
            new Cookie(166 * TILE, 9 * TILE),
            new Walker(181 * TILE, 13 * TILE),

            // THE BOSS (grounded on the level's row-14 floor)
            new Bouncer(210 * TILE, 14 * TILE - 48)
        ];
    }
    return [];
};

const positionPlayerAtLevelStart = (player: Player, levelId: LevelId) => {
    player.resetActions();
    if (levelId === '1-2') {
        player.x = 8 * TILE;
        player.y = 2 * TILE;
    } else if (levelId === '1-1-cave') {
        player.x = (caveEntranceX + 1) * TILE - player.w / 2;
        player.y = -player.h;
    } else {
        player.x = 3 * TILE;
        player.y = 14 * TILE - player.h;
    }
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
};

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [screen, setScreen] = useState<'start' | 'select' | 'game' | 'tbc'>('start');
    const running = screen === 'game';
    const [startLevel, setStartLevel] = useState<LevelId>('1-1');
    const [character, setCharacter] = useState<"ginja" | "darren" | "passive" | "tymeless" | "deeno" | "ryno" | "roman" | "grams">("ginja");
    const [musicVolume, setMusicVolume] = useState(0.5);
    const [touchStartX, setTouchStartX] = useState(0);
    const characters = ["ginja", "darren", "passive", "tymeless", "deeno", "ryno", "roman", "grams"] as const;
    
    // Internal resolution: Dynamic for mobile to fill the screen
    const [canvasWidth, setCanvasWidth] = useState(1024);
    const [canvasHeight, setCanvasHeight] = useState(640);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined'
        ? window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches
        : false
    );
    const usePortraitStartScreen = isMobile && canvasHeight >= canvasWidth;

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
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
        levelTransitionState: 'none' as 'none' | 'sliding' | 'walking' | 'fireworks' | 'pipeEnterCave',
        levelTransitionTimer: 0,
        levelTransitionScore: 0,
        levelTransitionScoreX: 0,
        levelTransitionScoreY: 0,
        levelTransitionNextLevel: null as LevelId | null,
        bossWarningTimer: 0,
        pipeCooldown: 0,
        levelTiles: {} as Partial<Record<LevelId, ReturnType<typeof getTiles>>>,
        levelEnemies: {} as Partial<Record<LevelId, EnemyEntity[]>>,
        checkpoints: {} as Partial<Record<LevelId, boolean>>,
        checkpointNotice: 0,
        fireworks: [] as FireworkBurst[]
    });
    const musicRequestRef = useRef(0);

    useEffect(() => {
        if (gameRef.current.bgMusic) {
            gameRef.current.bgMusic.volume = musicVolume;
        }
    }, [musicVolume]);

    const playBackgroundMusic = (path: string) => {
        if (gameRef.current.bgMusic) {
            if (gameRef.current.bgMusic.src.endsWith(path)) {
                musicRequestRef.current++;
                if (gameRef.current.bgMusic.paused) {
                    gameRef.current.bgMusic.play().catch(() => {});
                }
                return;
            }
        }
        
        const music = new Audio(path);
        const requestId = ++musicRequestRef.current;
        music.loop = true;
        music.volume = musicVolume;
        
        music.play().then(() => {
            if (requestId !== musicRequestRef.current) {
                music.pause();
                return;
            }
            // Only pause and switch if the new music actually starts playing
            if (gameRef.current.bgMusic) {
                gameRef.current.bgMusic.pause();
                gameRef.current.bgMusic.src = "";
            }
            gameRef.current.bgMusic = music;
        }).catch((err) => {
            if (requestId !== musicRequestRef.current) return;
            console.warn(`Failed to play music at ${path}:`, err);
            // If it failed to play (e.g. missing file), keep current music playing
            if (gameRef.current.bgMusic && gameRef.current.bgMusic.paused) {
                gameRef.current.bgMusic.play().catch(() => {});
            }
        });
    };

    const applyLevelSettings = (levelId: LevelId, resetTimer = true) => {
        if (resetTimer) gameRef.current.timer = levelId === '1-2' ? 233 : 250;
        gameRef.current.lastTimerUpdate = Date.now();
        
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
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)
                && canvasRef.current) e.preventDefault();
        };
        const handleKeyUp = (e: KeyboardEvent) => gameRef.current.keys[e.code] = false;
        const clearKeys = () => {
            gameRef.current.keys = {};
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', clearKeys);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', clearKeys);
        };
    }, []);

    useEffect(() => {
        if (screen !== 'game') gameRef.current.keys = {};
    }, [screen]);

    useEffect(() => {
        if (!running) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let resetThisFrame = false;

        const reset = () => {
            if (resetThisFrame) return;
            resetThisFrame = true;
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
            const resetLevelId = currentLevelId;
            gameRef.current.levelTiles[resetLevelId] = gameRef.current.tiles;
            gameRef.current.enemies = getEnemiesForLevel(resetLevelId);
            gameRef.current.levelEnemies[resetLevelId] = gameRef.current.enemies;
            gameRef.current.powerups = [];
            gameRef.current.coins = [];
            gameRef.current.fireworks = [];
            gameRef.current.bossWarningTimer = 0;
            gameRef.current.pipeCooldown = 0;
            gameRef.current.levelTransitionState = 'none';
            gameRef.current.levelTransitionTimer = 0;
            gameRef.current.levelTransitionScore = 0;
            gameRef.current.levelTransitionNextLevel = null;
            gameRef.current.keys = {};
            gameRef.current.player.state = "small";
            gameRef.current.player.isInvincible = false;
            gameRef.current.player.invincibilityTimer = 0;
            gameRef.current.player.hurtCooldown = 0;
            gameRef.current.player.h = 72;
            gameRef.current.player.w = 48;
            positionPlayerAtLevelStart(gameRef.current.player, resetLevelId);
            const checkpointX = CHECKPOINT_X[resetLevelId];
            if (gameRef.current.checkpoints[resetLevelId] && checkpointX !== undefined) {
                gameRef.current.player.x = checkpointX;
                gameRef.current.player.y = 14 * TILE - gameRef.current.player.h;
                gameRef.current.player.hurtCooldown = 90;
            }
            applyLevelSettings(resetLevelId);

            // Reset Camera
            camera.x = Math.max(0, gameRef.current.player.x - canvas.width / 2);
            camera.y = isMobile ? getMobileCameraY(gameRef.current.player, canvas.width, canvas.height) : 0;
            camera.lookAhead = 0;
        };

        const launchFirework = (screenX: number, screenY: number, scale = 1) => {
            const palette = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];
            const outerCount = isMobile ? 30 : 42;
            const innerCount = isMobile ? 10 : 14;
            const particles: FireworkParticle[] = [];

            for (let i = 0; i < outerCount; i++) {
                const angle = (i / outerCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
                const speed = (3.2 + Math.random() * 2.4) * scale;
                const life = 68 + Math.floor(Math.random() * 24);
                particles.push({
                    x: 0,
                    y: 0,
                    previousX: 0,
                    previousY: 0,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 0.25,
                    life,
                    maxLife: life,
                    size: (isMobile ? 2.5 : 3.5) + Math.random() * 2,
                    color: palette[i % palette.length],
                    twinkle: Math.floor(Math.random() * 8)
                });
            }

            for (let i = 0; i < innerCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (1.4 + Math.random() * 2.1) * scale;
                const life = 48 + Math.floor(Math.random() * 22);
                particles.push({
                    x: 0,
                    y: 0,
                    previousX: 0,
                    previousY: 0,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 0.2,
                    life,
                    maxLife: life,
                    size: (isMobile ? 2 : 3) + Math.random() * 1.5,
                    color: palette[(i + 1) % palette.length],
                    twinkle: Math.floor(Math.random() * 8)
                });
            }

            gameRef.current.fireworks.push({
                x: camera.x + Math.max(70, Math.min(canvas.width - 70, screenX)),
                y: camera.y + Math.max(80, Math.min(canvas.height * 0.58, screenY)),
                timer: 0,
                ringColor: palette[1],
                particles
            });
            if (gameRef.current.fireworks.length > 8) gameRef.current.fireworks.shift();
            playSound('firework', 0.55);
        };

        let lastTime = performance.now();
        const fpsInterval = 1000 / 60;

        const loop = (currentTime: number) => {
            animationFrameId = requestAnimationFrame(loop);

            const elapsed = currentTime - lastTime;

            if (elapsed > fpsInterval) {
                lastTime = currentTime - (elapsed % fpsInterval);
                resetThisFrame = false;
                if (gameRef.current.checkpointNotice > 0) gameRef.current.checkpointNotice--;

                const { player, tiles, clouds, scenery, enemies, powerups, coins, keys } = gameRef.current;

                if (gameRef.current.levelTransitionState === 'none') {
                    // Update Player
                    player.update(keys);
                    applyPhysics(player);

                    // Invincibility no longer swaps background music; keep level theme playing.

                    // Update Enemies
                    enemies.forEach(e => {
                        const isBouncer = e instanceof Bouncer;
                        if (!isBouncer && (e.x - camera.x < -100 || e.x - camera.x > canvas.width + 100)) return;

                        if (isBouncer) e.update(player.x + player.w / 2);
                        else e.update();
                        applyPhysics(e);
                        collideTiles(e, tiles);
                    });

                // Update PowerUps
                powerups.forEach(m => {
                    m.update();
                    applyPhysics(m);
                    collideTiles(m, tiles);
                    if (m.y > 18 * TILE) m.active = false;
                });
                gameRef.current.powerups = powerups.filter(m => m.active);

                // Update Coins
                coins.forEach(c => {
                    c.update();
                    collideTiles(c, tiles);
                    if (c.y > 18 * TILE) c.active = false;
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
                collidePowerUps(player, powerups, undefined, () => {
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
                }, tiles);
                if (resetThisFrame) return;
                collideTiles(player, tiles, (t) => {
                    // Logic to decide whether to spawn a PowerUp or a Coin
                    let shouldSpawnPowerUp = false;
                    
                    if (t.type === 'question') {
                        // 🌟 Guaranteed PowerUp Locations
                        if (
                            (t.x === 15 * TILE && t.y === 9 * TILE) ||
                            (currentLevelId === '1-2' && t.x === 124 * TILE && t.y === 8 * TILE) ||
                            (currentLevelId === '1-3' && t.x === 197 * TILE && t.y === 9 * TILE)
                        ) {
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

                const activeLevelBoss = currentLevelId === '1-3'
                    ? enemies.find(e => (e as any).isBoss && e.alive && (e.hp ?? 0) > 0)
                    : undefined;
                const bossGateX = 232 * TILE;
                const checkpointX = CHECKPOINT_X[currentLevelId];
                if (checkpointX !== undefined && !gameRef.current.checkpoints[currentLevelId]
                    && player.onGround && player.x + player.w / 2 >= checkpointX) {
                    gameRef.current.checkpoints[currentLevelId] = true;
                    gameRef.current.checkpointNotice = 150;
                    playSound('powerup');
                }

                if (gameRef.current.bossWarningTimer > 0) {
                    gameRef.current.bossWarningTimer--;
                }
                if (gameRef.current.pipeCooldown > 0) {
                    gameRef.current.pipeCooldown--;
                }

                if (activeLevelBoss && player.x + player.w > bossGateX) {
                    if (gameRef.current.bossWarningTimer === 0) playSound('hit');
                    gameRef.current.bossWarningTimer = 90;
                    player.x = bossGateX - player.w;
                    player.vx = -4;
                }

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
                if (keys['ArrowDown'] && player.onGround && gameRef.current.pipeCooldown === 0) {
                    // Warp Pipe 1-1 -> Cave
                    if (currentLevelId === '1-1') {
                        const pipeX = 46 * TILE;
                        if (player.x + player.w / 2 > pipeX && player.x + player.w / 2 < pipeX + 2 * TILE) {
                            gameRef.current.levelTiles['1-1'] = tiles;
                            gameRef.current.levelEnemies['1-1'] = enemies;
                            setCurrentLevel('1-1-cave');

                            // Load cave level content (without killing the player / losing a life)
                            gameRef.current.tiles = gameRef.current.levelTiles['1-1-cave'] ?? getTiles();
                            gameRef.current.levelTiles['1-1-cave'] = gameRef.current.tiles;
                            gameRef.current.clouds = getClouds();
                            gameRef.current.scenery = getScenery();
                            gameRef.current.enemies = gameRef.current.levelEnemies['1-1-cave'] ?? getEnemiesForLevel('1-1-cave');
                            gameRef.current.levelEnemies['1-1-cave'] = gameRef.current.enemies;
                            gameRef.current.powerups = [];
                            gameRef.current.coins = [];
                            gameRef.current.fireworks = [];
                            applyLevelSettings('1-1-cave', false);

                            // Drop from the World 1-1 pipe through the matching roof opening.
                            player.x = (caveEntranceX + 1) * TILE - player.w / 2;
                            player.y = -player.h;
                            player.vx = 0;
                            player.vy = 0;
                            player.onGround = false;
                            gameRef.current.levelTransitionState = 'pipeEnterCave';
                            gameRef.current.levelTransitionTimer = 0;
                            gameRef.current.pipeCooldown = 45;
                            gameRef.current.keys['ArrowDown'] = false;

                            // Reset Camera
                            camera.x = 0;
                            camera.y = isMobile ? getMobileCameraY(player, canvas.width, canvas.height) : 0;
                            camera.lookAhead = 0;
                            playSound('pipe');
                        }
                    }
                    // Exit Pipe Cave -> 1-1
                    else if (currentLevelId === '1-1-cave') {
                        const pipeX = caveExitPipeX * TILE;
                        if (player.x + player.w / 2 > pipeX && player.x + player.w / 2 < pipeX + 2 * TILE) {
                            gameRef.current.levelTiles['1-1-cave'] = tiles;
                            gameRef.current.levelEnemies['1-1-cave'] = enemies;
                            setCurrentLevel('1-1');

                            // Load overworld content (without killing the player / losing a life)
                            gameRef.current.tiles = gameRef.current.levelTiles['1-1'] ?? getTiles();
                            gameRef.current.levelTiles['1-1'] = gameRef.current.tiles;
                            gameRef.current.clouds = getClouds();
                            gameRef.current.scenery = getScenery();
                            gameRef.current.enemies = gameRef.current.levelEnemies['1-1'] ?? getEnemiesForLevel('1-1');
                            gameRef.current.levelEnemies['1-1'] = gameRef.current.enemies;
                            gameRef.current.powerups = [];
                            gameRef.current.coins = [];
                            gameRef.current.fireworks = [];
                            player.x = 163 * TILE;
                            player.y = 12 * TILE - player.h;
                            player.vx = 0;
                            player.vy = 0;
                            player.onGround = true;
                            playSound('pipe');
                            applyLevelSettings('1-1', false);
                            gameRef.current.pipeCooldown = 45;
                            gameRef.current.keys['ArrowDown'] = false;

                            // Snap to the downstream exit instead of panning across the whole level.
                            camera.x = Math.max(0, player.x - canvas.width / 2);
                            camera.y = isMobile ? getMobileCameraY(player, canvas.width, canvas.height) : 0;
                            camera.lookAhead = 0;
                        }
                    }
                }

                // Flagpole transition
                // Crossing the pole horizontally counts even if a boosted jump clears its top.
                const flagTile = tiles.find(t =>
                    t.type === 'flagpole' &&
                    player.x < t.x + t.w &&
                    player.x + player.w > t.x
                );
                if (flagTile && activeLevelBoss) {
                    if (gameRef.current.bossWarningTimer === 0) playSound('hit');
                    gameRef.current.bossWarningTimer = 120;
                    player.x = Math.min(player.x, bossGateX - player.w);
                    player.vx = -6;
                } else if (flagTile) {
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
                    gameRef.current.levelTransitionTimer++;
                    if ('facingRight' in player) {
                        (player as any).facingRight = true;
                    }

                    if ((gameRef.current.levelTransitionTimer - 12) % 48 === 0) {
                        const burstIndex = Math.floor(gameRef.current.levelTransitionTimer / 48);
                        const side = burstIndex % 2 === 0 ? -1 : 1;
                        const poleScreenX = player.x - camera.x + player.w / 2;
                        const spread = Math.min(210, canvas.width * 0.22);
                        launchFirework(
                            poleScreenX + side * (spread + Math.random() * 55),
                            canvas.height * (0.2 + Math.random() * 0.24)
                        );
                    }

                    if (player.y >= 14 * TILE - player.h) {
                        player.y = 14 * TILE - player.h;
                        gameRef.current.levelTransitionState = 'walking';
                        gameRef.current.levelTransitionTimer = 0;
                        launchFirework(player.x - camera.x + player.w / 2, canvas.height * 0.3, 1.25);
                    }
                } else if (gameRef.current.levelTransitionState === 'walking') {
                    player.vx = 2;
                    player.x += player.vx;
                    player.vy = 0;
                    if ('walkDistance' in player) {
                        (player as any).walkDistance += Math.abs(player.vx);
                    }
                    
                    gameRef.current.levelTransitionTimer++;
                    
                    if ([18, 62, 106].includes(gameRef.current.levelTransitionTimer)) {
                        const burstIndex = [18, 62, 106].indexOf(gameRef.current.levelTransitionTimer);
                        const positions = [0.27, 0.72, 0.5];
                        launchFirework(
                            canvas.width * positions[burstIndex],
                            canvas.height * (0.2 + Math.random() * 0.22),
                            burstIndex === 2 ? 1.15 : 1
                        );
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
                                const nextLevel = gameRef.current.levelTransitionNextLevel;
                                setCurrentLevel(nextLevel);
                                gameRef.current.tiles = getTiles();
                                gameRef.current.levelTiles[nextLevel] = gameRef.current.tiles;
                                gameRef.current.clouds = getClouds();
                                gameRef.current.scenery = getScenery();
                                gameRef.current.enemies = getEnemiesForLevel(nextLevel);
                                gameRef.current.levelEnemies[nextLevel] = gameRef.current.enemies;
                                gameRef.current.powerups = [];
                                gameRef.current.coins = [];
                                gameRef.current.bossWarningTimer = 0;
                                positionPlayerAtLevelStart(gameRef.current.player, nextLevel);
                                applyLevelSettings(nextLevel);
                                gameRef.current.levelTransitionState = 'none';
                                gameRef.current.fireworks = [];

                                // Reset Camera
                                camera.x = 0;
                                camera.y = isMobile ? getMobileCameraY(gameRef.current.player, canvas.width, canvas.height) : 0;
                                camera.lookAhead = 0;
                            } else if (currentLevelId === '1-3') {
                                gameRef.current.levelTransitionState = 'none';
                                gameRef.current.levelTransitionTimer = 0;
                                gameRef.current.levelTransitionNextLevel = null;
                                setScreen('tbc');
                            }
                        }
                    }
                } else if (gameRef.current.levelTransitionState === 'pipeEnterCave') {
                    // Lower Jay through the two-tile roof opening before restoring control.
                    player.vx = 0;
                    player.vy = Math.min(player.vy + 0.7, 8);
                    player.y += player.vy;
                    player.onGround = false;

                    gameRef.current.levelTransitionTimer++;
                    if (player.y >= 2 * TILE || gameRef.current.levelTransitionTimer > 90) {
                        player.y = 2 * TILE;
                        gameRef.current.levelTransitionState = 'none';
                        gameRef.current.levelTransitionTimer = 0;
                    }
                }
                
                gameRef.current.fireworks.forEach(fw => {
                    fw.timer++;
                    fw.particles.forEach(p => {
                        p.previousX = p.x;
                        p.previousY = p.y;
                        p.x += p.vx;
                        p.y += p.vy;
                        p.vx *= 0.985;
                        p.vy = p.vy * 0.985 + 0.045;
                        p.life--;
                    });
                    fw.particles = fw.particles.filter(p => p.life > 0);
                });
                gameRef.current.fireworks = gameRef.current.fireworks.filter(fw => fw.particles.length > 0);
                
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
                    return;
                }
            }

            // Camera
            if (gameRef.current.levelTransitionState === 'none') {
                updateCamera(player, canvas.width, canvas.height, keys, isMobile);
                if (currentLevelId === '1-1-cave') {
                    camera.x = Math.min(camera.x, Math.max(0, caveWidth * TILE - canvas.width));
                }
            }

            if (player.y > 18 * TILE) {
                reset();
                return;
            }

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
                    if (isMobile && t.type === 'ground' && t.y >= 14 * TILE) {
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

                        const flagIsLowering = gameRef.current.levelTransitionState === 'sliding' || gameRef.current.levelTransitionState === 'walking';
                        const flagDrop = flagIsLowering ? Math.min(8 * TILE, Math.max(0, player.y - 3 * TILE)) : 0;
                        const flagWave = Math.round(Math.sin(performance.now() / 110) * 3);
                        const flagY = t.y - camera.y + 10 + flagDrop;
                        ctx.fillStyle = "#ffffff";
                        ctx.beginPath();
                        ctx.moveTo(t.x - camera.x + 12, flagY);
                        ctx.lineTo(t.x - camera.x - 18, flagY + 3 + flagWave);
                        ctx.lineTo(t.x - camera.x - 18, flagY + 23 + flagWave);
                        ctx.lineTo(t.x - camera.x + 12, flagY + 20);
                        ctx.closePath();
                        ctx.fill();
                    }
                } else if (t.type === 'castle') {
                    const tx = Math.floor(t.x / TILE);
                    const ty = Math.floor(t.y / TILE);
                    let castleBaseX = 202;
                    if (currentLevelId === '1-2') castleBaseX = 242;
                    else if (currentLevelId === '1-3') castleBaseX = 244;
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

            const visibleLevelBoss = currentLevelId === '1-3'
                ? enemies.find(e => (e as any).isBoss && e.alive) as (EnemyEntity & {
                    maxHp?: number;
                    phase?: number;
                    telegraphTimer?: number;
                    chargeTimer?: number;
                }) | undefined
                : undefined;

            if (visibleLevelBoss && (visibleLevelBoss.hp ?? 0) > 0) {
                const gateScreenX = 232 * TILE - camera.x;
                if (gateScreenX > -24 && gateScreenX < canvas.width + 24) {
                    const pulse = 0.55 + Math.sin(performance.now() / 90) * 0.25;
                    ctx.save();
                    ctx.shadowColor = "#ff2b2b";
                    ctx.shadowBlur = 18;
                    ctx.fillStyle = `rgba(255, 35, 35, ${pulse})`;
                    ctx.fillRect(gateScreenX - 5, 80, 10, 14 * TILE - 80);
                    ctx.fillStyle = "rgba(255, 230, 120, 0.9)";
                    for (let y = 90; y < 14 * TILE; y += 36) {
                        ctx.fillRect(gateScreenX - 9, y, 18, 8);
                    }
                    ctx.restore();
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
            
            // Hide player only once they reach the correct castle door for this level.
            let castleHideX = 203.8 * TILE;
            if (currentLevelId === '1-2') castleHideX = 244 * TILE;
            else if (currentLevelId === '1-3') castleHideX = 246 * TILE;
            const isEnteringCastle = gameRef.current.levelTransitionState === 'walking' && player.x >= castleHideX;
            const checkpointX = CHECKPOINT_X[currentLevelId];
            if (checkpointX !== undefined) {
                const markerX = checkpointX - camera.x;
                const markerY = 14 * TILE - camera.y;
                ctx.save();
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(markerX, markerY - 100, 5, 100);
                ctx.fillStyle = gameRef.current.checkpoints[currentLevelId] ? '#8cff88' : '#ffd447';
                ctx.beginPath();
                ctx.moveTo(markerX + 5, markerY - 100);
                ctx.lineTo(markerX + 43, markerY - 84);
                ctx.lineTo(markerX + 5, markerY - 68);
                ctx.fill();
                ctx.restore();
            }
            if (!isEnteringCastle) {
                player.draw(ctx, camera.x, camera.y);
                player.drawPowerEffects(ctx, camera.x, camera.y);
            }

            // Draw Fireworks
            gameRef.current.fireworks.forEach(fw => {
                const burstX = fw.x - camera.x;
                const burstY = fw.y - camera.y;
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';

                if (fw.timer < 10) {
                    const flashSize = 7 + fw.timer * 1.8;
                    ctx.globalAlpha = 1 - fw.timer / 10;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(burstX - flashSize / 2, burstY - flashSize / 2, flashSize, flashSize);
                }

                if (fw.timer < 28) {
                    const ringRadius = 8 + fw.timer * 2.7;
                    ctx.globalAlpha = (1 - fw.timer / 28) * 0.85;
                    ctx.fillStyle = fw.ringColor;
                    for (let i = 0; i < 16; i++) {
                        const angle = (i / 16) * Math.PI * 2;
                        const x = burstX + Math.cos(angle) * ringRadius;
                        const y = burstY + Math.sin(angle) * ringRadius;
                        ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 4);
                    }
                }

                fw.particles.forEach(p => {
                    const lifeRatio = p.life / p.maxLife;
                    const twinkle = (fw.timer + p.twinkle) % 7 < 2 ? 1 : 0.68;
                    const x = burstX + p.x;
                    const y = burstY + p.y;
                    const previousX = burstX + p.previousX;
                    const previousY = burstY + p.previousY;

                    ctx.globalAlpha = Math.max(0, lifeRatio) * twinkle;
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = isMobile ? 3 : 6;

                    const trailSize = Math.max(1, Math.round(p.size * 0.45));
                    ctx.globalAlpha *= 0.35;
                    ctx.fillRect(Math.round(previousX - trailSize / 2), Math.round(previousY - trailSize / 2), trailSize, trailSize);

                    ctx.globalAlpha = Math.max(0, lifeRatio) * twinkle;
                    const sparkSize = Math.max(2, Math.round(p.size));
                    ctx.fillRect(Math.round(x - sparkSize / 2), Math.round(y - sparkSize / 2), sparkSize, sparkSize);

                    if (lifeRatio > 0.72) {
                        ctx.globalAlpha = lifeRatio;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 2, 2);
                    }
                });
                ctx.restore();
            });

            // Draw Transition Score
            if (gameRef.current.levelTransitionState !== 'none' && gameRef.current.levelTransitionScore > 0) {
                ctx.fillStyle = "white";
                ctx.font = "bold 16px monospace";
                ctx.textAlign = "center";
                ctx.fillText(
                    gameRef.current.levelTransitionScore.toString(),
                    gameRef.current.levelTransitionScoreX - camera.x + player.w / 2,
                    gameRef.current.levelTransitionScoreY - camera.y
                );
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
            const hudWorld = currentLevelId === '1-1-cave' ? '1-1' : currentLevelId.toUpperCase();
            ctx.fillText(`WORLD ${hudWorld}`, canvas.width / 2, 90 * hudScale);
            
            ctx.textAlign = "right";
            ctx.font = `bold ${Math.floor(24 * hudScale)}px monospace`;
            ctx.fillText("TIME", canvas.width - 20 * hudScale, 40 * hudScale);
            ctx.fillText(Math.floor(gameRef.current.timer).toString().padStart(3, '0'), canvas.width - 20 * hudScale, 65 * hudScale);
            ctx.textAlign = 'left';
            ctx.font = `${12 * hudScale}px monospace`;
            ctx.fillStyle = player.state === 'big' || player.isInvincible ? player.profile.color : '#ffffff';
            ctx.fillText(player.state === 'big' || player.isInvincible
                ? (player.attackCooldown > 0 ? 'POWER RECHARGING' : 'X: POWER STRIKE')
                : 'FIND YOUR POWER-UP', 20 * hudScale, 90 * hudScale);
            if (gameRef.current.checkpointNotice > 0) {
                ctx.textAlign = 'center';
                ctx.fillStyle = '#8cff88';
                ctx.fillText('CHECKPOINT SAVED', canvas.width / 2, 108 * hudScale);
            }

            const bossHudVisible = visibleLevelBoss &&
                (visibleLevelBoss.hp ?? 0) > 0 &&
                camera.x + canvas.width > 198 * TILE;

            if (bossHudVisible && visibleLevelBoss) {
                const maxBossHp = visibleLevelBoss.maxHp ?? 5;
                const bossHp = Math.max(0, visibleLevelBoss.hp ?? 0);
                const bossPhase = visibleLevelBoss.phase ?? 1;
                const bossBarWidth = Math.min(canvas.width * 0.48, 380) * hudScale;
                const bossBarHeight = 16 * hudScale;
                const bossBarX = (canvas.width - bossBarWidth) / 2;
                const bossBarY = 120 * hudScale;

                ctx.textAlign = "center";
                ctx.font = `bold ${Math.floor(16 * hudScale)}px monospace`;
                ctx.fillStyle = "white";
                ctx.fillText(`BOUNCER - PHASE ${bossPhase}`, canvas.width / 2, bossBarY - 8 * hudScale);
                ctx.fillStyle = "rgba(30, 0, 0, 0.85)";
                ctx.fillRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
                ctx.fillStyle = bossPhase === 3 ? "#ff2b2b" : bossPhase === 2 ? "#f39c12" : "#2ecc71";
                ctx.fillRect(bossBarX, bossBarY, bossBarWidth * (bossHp / maxBossHp), bossBarHeight);
                ctx.strokeStyle = "white";
                ctx.lineWidth = 3;
                ctx.strokeRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);

                if ((visibleLevelBoss.telegraphTimer ?? 0) > 0) {
                    ctx.fillStyle = "#ffe66d";
                    ctx.fillText("CHARGE INCOMING!", canvas.width / 2, bossBarY + 38 * hudScale);
                }
            }

            if (gameRef.current.bossWarningTimer > 0) {
                ctx.textAlign = "center";
                ctx.font = `bold ${Math.floor(22 * hudScale)}px monospace`;
                ctx.fillStyle = "#ffe66d";
                ctx.strokeStyle = "#7a0000";
                ctx.lineWidth = 5;
                const warningY = (bossHudVisible ? 190 : 130) * hudScale;
                ctx.strokeText("DEFEAT BOUNCER TO OPEN THE EXIT", canvas.width / 2, warningY);
                ctx.fillText("DEFEAT BOUNCER TO OPEN THE EXIT", canvas.width / 2, warningY);
            }

            if (gameRef.current.combo > 1) {
                ctx.fillStyle = "#F1C40F";
                ctx.textAlign = "center";
                ctx.fillText(`COMBO x ${gameRef.current.combo}`, canvas.width / 2, (bossHudVisible ? 220 : 120) * hudScale);
            }
            }
        };

        loop(performance.now());
        return () => cancelAnimationFrame(animationFrameId);
    }, [running, isMobile]);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#000]">
            {screen === 'start' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                    <div 
                        className="relative w-full h-full"
                        style={{ 
                            backgroundImage: `url('${usePortraitStartScreen ? '/screens/start_screen_mob.png' : '/screens/start_screen_ginger_matched.png'}')`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated',
                            aspectRatio: usePortraitStartScreen ? '2 / 3' : '16 / 9',
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
                                top: usePortraitStartScreen ? '30.5%' : '32.2%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: usePortraitStartScreen ? '45%' : '28.5%',
                                height: usePortraitStartScreen ? '11%' : '20.5%'
                            }}
                            title="Start Engine"
                        />

                        {/* Ginger Jay Easter Egg */}
                        <button 
                            onClick={triggerGingerJayEasterEgg}
                            className="absolute cursor-pointer bg-transparent border-none outline-none focus:outline-none"
                            style={{
                                top: usePortraitStartScreen ? '42.5%' : '45%',
                                left: usePortraitStartScreen ? '28.5%' : '23%',
                                transform: 'translate(-50%, -50%)',
                                width: usePortraitStartScreen ? '15%' : '12%',
                                height: usePortraitStartScreen ? '15%' : '30%',
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
                            {IS_DEV && <div className="mb-8">
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
                            </div>}

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
                                    gameRef.current.levelTiles = { [startLevel]: gameRef.current.tiles };
                                    gameRef.current.clouds = getClouds();
                                    gameRef.current.scenery = getScenery();
                                    gameRef.current.enemies = getEnemiesForLevel(startLevel);
                                    gameRef.current.levelEnemies = { [startLevel]: gameRef.current.enemies };
                                    gameRef.current.powerups = [];
                                    gameRef.current.coins = [];
                                    gameRef.current.fireworks = [];
                                    gameRef.current.keys = {};
                                    
                                    // Reset State
                                    gameRef.current.checkpoints = {};
                                    gameRef.current.checkpointNotice = 0;
                                    gameRef.current.lives = 3;
                                    gameRef.current.coinsCollected = 0;
                                    gameRef.current.score = 0;
                                    gameRef.current.combo = 0;
                                    gameRef.current.levelTransitionState = 'none';
                                    gameRef.current.levelTransitionTimer = 0;
                                    gameRef.current.levelTransitionScore = 0;
                                    gameRef.current.levelTransitionNextLevel = null;
                                    gameRef.current.bossWarningTimer = 0;
                                    gameRef.current.pipeCooldown = 0;
                                    positionPlayerAtLevelStart(gameRef.current.player, startLevel);
                                    
                                    applyLevelSettings(startLevel);
                                    
                                    // Reset Camera
                                    camera.x = 0;
                                    camera.y = isMobile ? getMobileCameraY(gameRef.current.player, canvasWidth, canvasHeight) : 0;
                                    camera.lookAhead = 0;

                                    setScreen('game');
                                }}
                                className="px-10 py-5 text-xl bg-[#c84c0c] text-white border-4 border-white font-bold cursor-pointer hover:bg-[#a03c0a] transition-colors"
                            >
                                START ENGINE
                            </button>
                            <p className="mt-3 text-sm">Arrows / WASD: move · Space: jump · Shift / B: run · X: powered strike</p>
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
                                {IS_DEV && <div className="mb-4">
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
                                </div>}

                                <button 
                                    onClick={() => {
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
                                        gameRef.current.levelTiles = { [startLevel]: gameRef.current.tiles };
                                        gameRef.current.clouds = getClouds();
                                        gameRef.current.scenery = getScenery();
                                        gameRef.current.enemies = getEnemiesForLevel(startLevel);
                                        gameRef.current.levelEnemies = { [startLevel]: gameRef.current.enemies };
                                        gameRef.current.powerups = [];
                                        gameRef.current.coins = [];
                                        gameRef.current.fireworks = [];
                                        gameRef.current.keys = {};
                                        
                                        // Reset State
                                        gameRef.current.checkpoints = {};
                                        gameRef.current.checkpointNotice = 0;
                                        gameRef.current.lives = 3;
                                        gameRef.current.coinsCollected = 0;
                                        gameRef.current.score = 0;
                                        gameRef.current.combo = 0;
                                        gameRef.current.levelTransitionState = 'none';
                                        gameRef.current.levelTransitionTimer = 0;
                                        gameRef.current.levelTransitionScore = 0;
                                        gameRef.current.levelTransitionNextLevel = null;
                                        gameRef.current.bossWarningTimer = 0;
                                        gameRef.current.pipeCooldown = 0;
                                        positionPlayerAtLevelStart(gameRef.current.player, startLevel);
                                        
                                        applyLevelSettings(startLevel);
                                        
                                        // Reset Camera
                                        camera.x = 0;
                                        camera.y = isMobile ? getMobileCameraY(gameRef.current.player, canvasWidth, canvasHeight) : 0;
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
            {screen === 'game' && isMobile && (
                <MobileControls onControl={(code, isDown) => {
                    gameRef.current.keys[code] = isDown;
                }} />
            )}
            {screen === 'tbc' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black text-white p-6 md:p-10 text-center">
                    <h1 className="text-3xl md:text-6xl font-bold mb-5 md:mb-8 text-yellow-500 [text-shadow:4px_4px_0_#900]">LEVEL COMPLETE!</h1>
                    <p className="text-xl md:text-4xl font-bold mb-8 md:mb-12">YOU HAVE DEFEATED BOUNCER (for now...)</p>
                    <div className="text-2xl md:text-5xl font-black tracking-widest animate-pulse text-red-600 mb-8 md:mb-12">
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

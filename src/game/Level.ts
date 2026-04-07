import { TILE } from './Constants';
import * as Level1_1 from './levels/Level1_1';
import * as Level1_1_Cave from './levels/Level1_1_Cave';
import * as Level1_2 from './levels/Level1_2';
import * as Level1_3 from './levels/Level1_3';

export type LevelId = '1-1' | '1-1-cave' | '1-2' | '1-3';

export const levelMaps: Record<LevelId, string[]> = {
    '1-1': Level1_1.generateMap(),
    '1-1-cave': Level1_1_Cave.generateMap(),
    '1-2': Level1_2.generateMap(),
    '1-3': Level1_3.generateMap(),
};

export let currentLevelId: LevelId = '1-1';
export let currentLevelMap = levelMaps[currentLevelId];

export function setCurrentLevel(level: LevelId) {
    currentLevelId = level;
    currentLevelMap = levelMaps[level];
}

export interface Tile { 
    x: number; y: number; w: number; h: number; 
    type: 'ground' | 'brick' | 'question' | 'pipe' | 'solid' | 'flagpole' | 'castle' | 'plant' | 'coin';
    isTop?: boolean;
    isLeft?: boolean;
    destroyed?: boolean;
    used?: boolean;
}

// ... (rest of the file)
export interface CloudPart { cx: number; cy: number; r: number; }
export interface Cloud { x: number; y: number; parallaxSpeed: number; driftSpeed: number; layer: number; parts: CloudPart[]; }
export interface Scenery { x: number; y: number; type: 'hill' | 'bush' | 'small_bush' }

export function getTiles(): Tile[] {
    const tiles: Tile[] = [];
    currentLevelMap.forEach((row, y) => {
        row.split("").forEach((char, x) => {
            if (char === "#") tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'ground' });
            else if (char === "B") tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'brick' });
            else if (char === "?") tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'question' });
            else if (char === "S") tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'solid' });
            else if (char === "P") {
                const isTop = y > 0 && currentLevelMap[y-1][x] !== 'P';
                const isLeft = x > 0 && currentLevelMap[y][x-1] !== 'P';
                tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'pipe', isTop, isLeft });
            }
            else if (char === "L") {
                tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'plant' });
            }
            else if (char === "F" || char === "f") {
                tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'flagpole', isTop: char === 'F' });
            }
            else if (char === "C") tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'castle' });
            else if (char === 'c') tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'coin' });
        });
    });
    return tiles;
}

export function getClouds(): Cloud[] {
    const clouds: Cloud[] = [];
    
    const createCloud = (x: number, y: number, layer: number, parallaxSpeed: number, driftSpeed: number): Cloud => {
        const parts: CloudPart[] = [];
        const numParts = 3 + Math.floor(Math.random() * 3); // 3 to 5 parts
        let cx = 0;
        for (let i = 0; i < numParts; i++) {
            const isEdge = i === 0 || i === numParts - 1;
            const r = isEdge ? 15 + Math.random() * 5 : 20 + Math.random() * 10;
            const cy = isEdge ? 0 : -5 - Math.random() * 10;
            parts.push({ cx, cy, r });
            cx += r * 1.2;
        }
        return { x, y, parallaxSpeed, driftSpeed, layer, parts };
    };

    const wrapWidth = 1424; // 1024 + 400
    
    // Layer 1: Back (Slowest parallax, highest up)
    for (let x = 0; x < wrapWidth; x += 350) {
        clouds.push(createCloud(x + Math.random() * 50, 120 + Math.random() * 20, 1, 0.15, 10));
    }
    // Layer 2: Mid
    for (let x = 100; x < wrapWidth; x += 450) {
        clouds.push(createCloud(x + Math.random() * 50, 180 + Math.random() * 20, 2, 0.3, 20));
    }
    // Layer 3: Front (Fastest parallax, lowest down)
    for (let x = 200; x < wrapWidth; x += 550) {
        clouds.push(createCloud(x + Math.random() * 50, 240 + Math.random() * 20, 3, 0.45, 30));
    }

    return clouds;
}

export function getScenery(): Scenery[] {
    const scenery: Scenery[] = [];
    
    // Classic 1-1 scenery pattern
    for (let i = 0; i < 7000; i += 48 * TILE) { // Pattern repeats every 48 blocks
        // Small bush
        scenery.push({ x: i + 7.5 * TILE, y: 14 * TILE, type: 'small_bush' });
        // Big hill
        scenery.push({ x: i + 13.5 * TILE, y: 14 * TILE, type: 'hill' });
        // Small bush
        scenery.push({ x: i + 23.5 * TILE, y: 14 * TILE, type: 'small_bush' });
        // Big bush
        scenery.push({ x: i + 38.5 * TILE, y: 14 * TILE, type: 'bush' });
    }
    return scenery;
}

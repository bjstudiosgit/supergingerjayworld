import { TILE } from './Constants';

export const levelWidth = 220;
export const levelHeight = 16;

export const levelMap = (function generateLevelMap(): string[] {
    const map: string[][] = Array(levelHeight).fill(null).map(() => Array(levelWidth).fill('.'));

    for (let x = 0; x < levelWidth; x++) {
        map[14][x] = '#';
        map[15][x] = '#';
    }

    const gaps = [69, 70, 86, 87, 88, 153, 154, 189, 190];
    gaps.forEach(x => {
        map[14][x] = '.';
        map[15][x] = '.';
    });

    const place = (x: number, y: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            if (x + i < levelWidth) map[y][x + i] = str[i];
        }
    };

    const pipe = (x: number, h: number) => {
        for (let y = 14 - h; y < 14; y++) {
            map[y][x] = 'P';
            map[y][x+1] = 'P';
        }
    };

    const plant = (x: number, h: number) => {
        map[14 - h][x] = 'L';
    };

    const stairsUp = (startX: number, height: number) => {
        for (let i = 0; i < height; i++) {
            for (let y = 13 - i; y <= 13; y++) {
                map[y][startX + i] = 'S';
            }
        }
    };
    const stairsDown = (startX: number, height: number) => {
        for (let i = 0; i < height; i++) {
            for (let y = 13 - (height - 1 - i); y <= 13; y++) {
                map[y][startX + i] = 'S';
            }
        }
    };

    // Tutorial: Force block break
    // place(6, 11, 'SSBSS');
    // for (let y = 8; y <= 13; y++) map[y][11] = 'S';

    plant(18, 2);
    plant(24, 3);

    plant(60, 2);
    plant(64, 3);

    plant(90, 2);
    plant(96, 3);

    plant(140, 2);
    plant(145, 3);

    plant(170, 2);
    plant(175, 3);

    place(16, 9, '?');
    place(20, 9, 'B?B?B');
    place(22, 5, '?');

    pipe(28, 2);
    pipe(38, 3);
    pipe(46, 4);
    pipe(57, 4);

    place(77, 9, 'B?B');
    place(80, 5, 'B');

    place(94, 9, 'B?B?B');
    place(100, 5, 'B');
    place(106, 9, 'B?B');
    place(114, 9, 'B');
    place(118, 9, 'B?B');

    stairsUp(134, 4);
    stairsDown(138, 4);

    stairsUp(148, 4);
    stairsDown(152, 4);

    pipe(163, 2);
    place(168, 9, 'B?B?');

    stairsUp(181, 8);
    map[13][189] = 'S';

    stairsUp(192, 8);
    map[13][200] = 'S';

    place(198, 3, 'F');
    for(let y=4; y<=13; y++) map[y][198] = 'f';

    place(204, 9, 'CCCCC');
    place(204, 10, 'CCCCC');
    place(204, 11, 'CCCCC');
    place(204, 12, 'CCCCC');
    place(204, 13, 'CCCCC');
    map[13][206] = '.';
    map[12][206] = '.';

    return map.map(row => row.join(''));
})();

export interface Tile { 
    x: number; y: number; w: number; h: number; 
    type: 'ground' | 'brick' | 'question' | 'pipe' | 'solid' | 'flagpole' | 'castle' | 'plant';
    isTop?: boolean;
    isLeft?: boolean;
    destroyed?: boolean;
    used?: boolean;
}
export interface CloudPart { cx: number; cy: number; r: number; }
export interface Cloud { x: number; y: number; parallaxSpeed: number; driftSpeed: number; layer: number; parts: CloudPart[]; }
export interface Scenery { x: number; y: number; type: 'hill' | 'bush' | 'small_bush' }

export function getTiles(): Tile[] {
    const tiles: Tile[] = [];
    levelMap.forEach((row, y) => {
        row.split("").forEach((char, x) => {
            if (char === "#") tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'ground' });
            else if (char === "B") tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'brick' });
            else if (char === "?") tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'question' });
            else if (char === "S") tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'solid' });
            else if (char === "P") {
                const isTop = y > 0 && levelMap[y-1][x] !== 'P';
                const isLeft = x > 0 && levelMap[y][x-1] !== 'P';
                tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'pipe', isTop, isLeft });
            }
            else if (char === "L") {
                tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'plant' });
            }
            else if (char === "F" || char === "f") {
                tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'flagpole', isTop: char === 'F' });
            }
            else if (char === "C") tiles.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, type: 'castle' });
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

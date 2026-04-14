export const width = 250;
export const height = 16;

export const generateMap = (): string[] => {
    const map: string[][] = Array(height).fill(null).map(() => Array(width).fill('.'));

    // --- HELPER FUNCTIONS ---
    const place = (x: number, y: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            if (x + i < width) map[y][x + i] = str[i];
        }
    };

    const block = (x: number, y: number, w: number, h: number, type: string) => {
        for (let iy = 0; iy < h; iy++) {
            for (let ix = 0; ix < w; ix++) {
                if (x + ix < width && y + iy < height) map[y + iy][x + ix] = type;
            }
        }
    };

    const pipe = (x: number, h: number) => {
        for (let y = 14 - h; y < 14; y++) {
            if (x < width) {
                map[y][x] = 'P';
                map[y][x + 1] = 'P';
            }
        }
    };

    const stairsUp = (startX: number, h: number) => {
        for (let i = 0; i < h; i++) {
            for (let y = 13 - i; y <= 13; y++) {
                if (startX + i < width) map[y][startX + i] = 'S';
            }
        }
    };

    const stairsDown = (startX: number, h: number) => {
        for (let i = 0; i < h; i++) {
            for (let y = 13 - (h - 1 - i); y <= 13; y++) {
                if (startX + i < width) map[y][startX + i] = 'S';
            }
        }
    };

    // --- BASE FLOOR ---
    for (let x = 0; x < width; x++) {
        map[14][x] = '#';
        map[15][x] = '#';
    }

    // --- GAPS ---
    const gaps: number[] = [60, 61, 62, 120, 121, 190, 191]; 
    gaps.forEach(x => {
        if (x < width) {
            map[14][x] = '.';
            map[15][x] = '.';
        }
    });

    // --- LEVEL DESIGN ---

    // Part 1: Intro
    place(15, 9, 'B?B?B');
    place(25, 9, 'BB?BB');
    pipe(35, 2);
    pipe(45, 3);
    pipe(55, 2);

    // Part 2: Middle Jumps
    place(70, 10, 'BBBB');
    place(72, 6, 'c?c');
    place(80, 10, 'BBBB');
    pipe(95, 4);

    // Part 3: High Platforms
    place(110, 8, 'BBBBBB');
    place(112, 4, 'c?c?c');
    place(130, 8, 'BBBBBB');

    // Part 4: Final Stretch (Boss Area)
    place(160, 10, 'BBBBBBBBBB');
    place(162, 6, 'c?c?c?c');
    
    stairsUp(210, 4);
    stairsDown(214, 4);

    // Part 5: Exit
    stairsUp(230, 8);

    // Flagpole
    place(240, 3, 'F');
    for (let y = 4; y <= 13; y++) map[y][240] = 'f';

    // End Castle
    for (let cy = 9; cy <= 13; cy++) {
        for (let cx = 244; cx <= 248; cx++) {
            if (cx < width) map[cy][cx] = 'C';
        }
    }

    return map.map(row => row.join(''));
};

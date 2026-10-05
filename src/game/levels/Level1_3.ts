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
    const gaps: number[] = [60, 61, 120, 121, 190, 191]; 
    gaps.forEach(x => {
        if (x < width) {
            map[14][x] = '.';
            map[15][x] = '.';
        }
    });

    // --- LEVEL DESIGN ---

    // Part 1: Intro
    place(8, 11, 'cccccc');
    place(15, 9, 'B?B?B');
    place(25, 9, 'BB?BB');
    pipe(35, 2);
    pipe(45, 2);
    pipe(55, 2);
    place(57, 9, 'cccccccc');

    // Part 2: Middle Jumps
    place(70, 10, 'BBBB');
    place(72, 6, 'B?B');
    place(80, 10, 'BBBB');
    place(83, 7, 'ccccc');
    pipe(95, 2);

    // Part 3: High Platforms
    place(110, 8, 'BBBBBB');
    place(112, 4, 'B?B?B');
    place(117, 9, 'cccccccc');
    place(130, 8, 'BBBBBB');
    place(132, 5, 'cccccc');

    // Part 4: Final Stretch (Boss Area)
    place(160, 10, 'BBBBBBBBBB');
    place(162, 6, 'B?B?B?B');
    place(187, 9, 'cccccccc');

    // A short recovery pocket and two low attack platforms frame the arena.
    place(196, 9, 'B?B');
    place(203, 10, 'BBB');
    place(224, 10, 'BBB');

    // Part 5: Exit
    place(234, 11, 'ccccc');

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

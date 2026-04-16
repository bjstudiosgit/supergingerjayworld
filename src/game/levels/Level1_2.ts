export const width = 250; // Longer level
export const height = 16;

export const generateMap = (): string[] => {
    const map: string[][] = Array(height).fill(null).map(() => Array(width).fill('.'));

    // Helper functions
    const place = (x: number, y: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            if (x + i < width) map[y][x + i] = str[i];
        }
    };

    const pipe = (x: number, h: number) => {
        for (let y = 14 - h; y < 14; y++) {
            if (x < width) map[y][x] = 'P';
            if (x + 1 < width) map[y][x + 1] = 'P';
        }
    };

    const block = (x: number, y: number, w: number, h: number, type: string) => {
        for (let iy = 0; iy < h; iy++) {
            for (let ix = 0; ix < w; ix++) {
                if (x + ix < width && y + iy < height) map[y + iy][x + ix] = type;
            }
        }
    };

    // Solid Floor and Ceiling (Standard SMB 1-2)
    for (let x = 0; x < width; x++) {
        map[14][x] = '#';
        map[15][x] = '#';
        map[0][x] = 'S';
        map[1][x] = 'S';
    }

    // Drop in entrance (Proper SMB 1-2 style)
    block(0, 0, 6, 12, 'S'); // Left wall structure
    block(6, 0, 15, 2, 'S'); // Top ceiling
    pipe(10, 3); // The pipe you "drop out of" (visual)

    // Create a clear spawn area around x=2.5, y=6
    // Actually, I'll move the initial structure so it's not overlapping the spawn.
    // Or just clear a hole.
    block(6, 2, 8, 8, '.');

    // First section: Staggered blocks
    place(15, 10, 'BBBBBB');
    place(17, 9, 'c');
    place(18, 9, 'c');

    place(25, 6, 'BBBB');
    place(32, 10, 'BBBB');

    // Pipe obstacle section
    pipe(50, 2);
    pipe(58, 3);
    pipe(66, 4);

    // Floating jumps over a pit
    const gaps = [146, 147];
    gaps.forEach(x => {
        map[14][x] = '.';
        map[15][x] = '.';
    });

    place(94, 11, 'SSS'); // Platform 1 (Lowered)
    place(98, 9, 'SSS');  // Platform 2 (Middle step)
    place(102, 7, 'SSS'); // Platform 3 (Top step)

    // Middle structure: The "Bridge"
    block(115, 11, 15, 1, 'B'); // Bottom bridge (Lowered)
    block(118, 8, 10, 1, 'B');  // Top bridge (Lowered)
    place(120, 7, 'c?c');

    // More jumps
    place(143, 10, 'S');
    place(148, 10, 'S');

    // Staircase section
    const stairsUp = (startX: number, h: number) => {
        for (let i = 0; i < h; i++) {
            for (let y = 13 - i; y <= 13; y++) {
                if (startX + i < width) map[y][startX + i] = 'S';
            }
        }
    };
    stairsUp(160, 6);
    block(166, 8, 10, 6, 'S'); // Raised ground

    // Hidden top path (walk on the ceiling!)
    // We already have ceiling at y=0,1. Let's make a gap in the secondary ceiling.
    block(170, 4, 40, 1, 'S'); // Secondary ceiling
    // If player can jump up here, they can walk to the end.

    // Exit pipes
    pipe(220, 3);
    pipe(235, 4);

    // Remove ceiling at the end for the flagpole/castle area
    for (let x = 230; x < width; x++) {
        map[0][x] = '.';
        map[1][x] = '.';
    }

    // Flagpole
    place(233, 3, 'F');
    for (let y = 4; y <= 13; y++) map[y][233] = 'f';

    // Castle (Transition to 1-3)
    for (let cy = 9; cy <= 13; cy++) {
        for (let cx = 242; cx <= 246; cx++) {
            map[cy][cx] = 'C';
        }
    }

    return map.map(row => row.join(''));
};

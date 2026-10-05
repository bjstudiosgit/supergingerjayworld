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

    // Roof opening above the drop-in spawn.
    block(8, 0, 2, 2, '.');

    // Normal entrance
    block(0, 0, 1, 14, 'S'); // Just a small left border wall

    // First section: Staggered blocks
    place(15, 11, 'BBBBBB');
    place(17, 10, 'c');
    place(18, 10, 'c');

    place(23, 9, 'BBBB');
    place(30, 11, 'BBBB');

    // Pipe obstacle section
    pipe(50, 2);
    pipe(58, 2);
    pipe(66, 2);

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
    // Side gaps let the 48px player hit the 40px question block without hitting a brick first.
    place(121, 8, 'BB.?.BB');

    // More jumps
    place(143, 11, 'SS');
    place(148, 11, 'SS');

    // Staircase section
    const stairsUp = (startX: number, h: number) => {
        for (let i = 0; i < h; i++) {
            for (let y = 13 - i; y <= 13; y++) {
                if (startX + i < width) map[y][startX + i] = 'S';
            }
        }
    };
    // Optional upper route. Floating steps leave a continuous lower corridor.
    place(160, 11, 'SSS');
    place(165, 9, 'SSS');
    place(170, 7, 'SSS');
    place(174, 6, 'SSSSSSSSSS');
    place(186, 6, 'SSSSSSSSSSSSS');
    place(176, 5, 'ccccc');
    place(188, 5, 'cccccccc');

    // Both routes have rewards; the lower route stays tall enough to walk through.
    place(164, 12, 'ccc');
    place(174, 12, 'cccc');
    place(178, 10, 'B?B');
    place(184, 12, 'cccc');
    place(190, 10, 'B?B');
    place(194, 12, 'cccc');

    // The routes rejoin for a final enemy-and-coin section.
    const finishCoins = [
        { x: 202, y: 12 }, { x: 203, y: 11 }, { x: 204, y: 10 },
        { x: 205, y: 11 }, { x: 206, y: 12 },
        { x: 211, y: 12 }, { x: 212, y: 11 }, { x: 213, y: 10 },
        { x: 214, y: 11 }, { x: 215, y: 12 }
    ];
    finishCoins.forEach(({ x, y }) => {
        map[y][x] = 'c';
    });

    pipe(220, 2);

    // Eight steps give a clear launch point for the top of the flagpole.
    stairsUp(223, 8);
    place(226, 8, 'c');
    place(228, 6, 'c');
    place(230, 4, 'c');

    // Open the roof early enough to create a readable exit chamber before the flag.
    for (let x = 226; x < width; x++) {
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

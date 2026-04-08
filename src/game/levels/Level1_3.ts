export const width = 250;
export const height = 16;

export const generateMap = (): string[] => {
    const map: string[][] = Array(height).fill(null).map(() => Array(width).fill('.'));

    // Helper functions
    const block = (x: number, y: number, w: number, h: number, type: string) => {
        for (let iy = 0; iy < h; iy++) {
            for (let ix = 0; ix < w; ix++) {
                if (x + ix < width && y + iy < height) map[y + iy][x + ix] = type;
            }
        }
    };

    const place = (x: number, y: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            if (x + i < width) map[y][x + i] = str[i];
        }
    };

    const ground = (start: number, end: number) => {
        for (let x = start; x < end; x++) {
            if (x < width) {
                map[14][x] = '#';
                map[15][x] = '#';
            }
        }
    };

    const mushroom = (x: number, y: number, w: number) => {
        // Cap
        block(x, y, w, 1, 'B');
        // Stem
        const stemX = x + Math.floor(w / 2);
        for (let iy = y + 1; iy < 14; iy++) {
            if (iy < height) map[iy][stemX] = 'S';
        }
    };

    // --- LEVEL LAYOUT ---

    // 0-30: Intro Area
    ground(0, 50);
    place(15, 9, 'cccccc');
    place(14, 10, 'B?B?B?BBB');
    place(15, 6, 'B?B?BB?');
    place(22, 5, 'c?c');

    // 30-70: Mushroom Platform Section
    mushroom(35, 10, 5);
    place(41, 9, 'SS');

    mushroom(45, 7, 3);
    place(50, 9, 'SS');

    mushroom(55, 10, 5);
    place(61, 8, 'SS');

    mushroom(65, 6, 7);
    place(67, 5, 'c?c');

    // 70-100: Ground & Pipe Section
    ground(55, 100);
    block(80, 12, 2, 2, 'P'); // Pipe
    place(85, 9, 'BBB');
    place(92, 11, 'SSSS'); // Solid steps

    // 100-150: High Altitude Athletic Section
    mushroom(105, 9, 3);
    place(110, 8, 'SS'); // Intermediate
    mushroom(115, 6, 5);
    place(121, 5, 'SS'); // Intermediate
    mushroom(125, 4, 3);
    place(130, 6, 'SS'); // Intermediate
    mushroom(135, 7, 5);
    place(142, 9, 'SS'); // Intermediate
    mushroom(146, 10, 3);

    // 150-180: Transition to Boss
    ground(155, 180);
    // Stairs up to Arena
    for (let i = 1; i <= 5; i++) {
        block(170 + i, 14 - i, 1, i, 'S');
    }

    // 180-230: Boss Arena (Elevated)
    block(176, 9, 45, 1, 'B'); // Arena Floor
    // Arena side walls (short)
    block(176, 7, 1, 2, 'S');
    block(220, 7, 1, 2, 'S');
    // Overhead platforms for the arena
    place(190, 5, 'BBBBB');
    place(205, 5, 'BBBBB');

    // 230-250: Exit Area
    ground(230, 250);
    // Final staircase
    for (let i = 1; i <= 8; i++) {
        block(230 + (i - 1), 14 - i, 1, i, 'S');
    }

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


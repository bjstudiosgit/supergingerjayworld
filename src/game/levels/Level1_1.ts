export const width = 220;
export const height = 16;

export const generateMap = (): string[] => {
    const map: string[][] = Array(height).fill(null).map(() => Array(width).fill('.'));

    for (let x = 0; x < width; x++) {
        map[14][x] = '#';
        map[15][x] = '#';
    }

    const gaps = [65, 66, 67, 88, 89, 90, 153, 154, 189, 190];
    gaps.forEach(x => {
        map[14][x] = '.';
        map[15][x] = '.';
    });

    const place = (x: number, y: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            if (x + i < width) map[y][x + i] = str[i];
        }
    };

    const pipe = (x: number, h: number) => {
        for (let y = 14 - h; y < 14; y++) {
            map[y][x] = 'P';
            map[y][x + 1] = 'P';
        }
    };

    const stairsUp = (startX: number, h: number) => {
        for (let i = 0; i < h; i++) {
            for (let y = 13 - i; y <= 13; y++) {
                map[y][startX + i] = 'S';
            }
        }
    };
    const stairsDown = (startX: number, h: number) => {
        for (let i = 0; i < h; i++) {
            for (let y = 13 - (h - 1 - i); y <= 13; y++) {
                map[y][startX + i] = 'S';
            }
        }
    };

    place(15, 9, '?');
    place(20, 9, 'B?B?B');
    place(22, 5, '?');

    pipe(27, 2);
    pipe(34, 3);
    pipe(46, 4);

    place(75, 11, 'B?B');
    place(78, 8, 'B?BBB?BBBB');
    place(83, 4, '?');

    place(92, 8, 'BB?BBB?B');
    place(98, 4, 'B?BB');
    place(104, 9, 'BBB?B');
    place(114, 9, 'B?B?');
    place(118, 11, 'BB');
    place(120, 9, 'B?B');

    stairsUp(128, 4);
    stairsDown(132, 4);

    stairsUp(140, 4);
    stairsDown(144, 4);

    pipe(163, 2);
    place(168, 9, 'B?B?');

    stairsUp(181, 8);

    place(193, 3, 'F');
    for (let y = 4; y <= 13; y++) map[y][193] = 'f';

    // Castle
    for (let cy = 9; cy <= 13; cy++) {
        for (let cx = 202; cx <= 206; cx++) {
            map[cy][cx] = 'C';
        }
    }

    return map.map(row => row.join(''));
};

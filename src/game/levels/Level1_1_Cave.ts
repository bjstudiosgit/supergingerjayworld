export const width = 26;
export const height = 16;
export const entranceX = 3;
export const exitPipeX = 22;

export const generateMap = (): string[] => {
    const map: string[][] = Array(height).fill(null).map(() => Array(width).fill('.'));

    // Compact SMB1-style bonus room shell.
    for (let x = 0; x < width; x++) {
        map[height - 2][x] = '#'; // Floor layer 1
        map[height - 1][x] = '#'; // Floor layer 2
        map[0][x] = 'S'; // Ceiling layer 1
        map[1][x] = 'S'; // Ceiling layer 2
    }
    for (let y = 0; y < height; y++) {
        map[y][0] = 'S'; // Left wall
        map[y][width - 1] = 'S'; // Right wall
    }

    // The World 1-1 pipe drops the player through this visible roof opening.
    for (let x = entranceX; x < entranceX + 2; x++) {
        map[0][x] = '.';
        map[1][x] = '.';
    }

    // Three short, reachable shelves with the original room's 19 loose coins.
    const layout = [
        { y: 11, start: 5, end: 11 },
        { y: 8, start: 9, end: 14 },
        { y: 5, start: 13, end: 18 }
    ];

    layout.forEach(p => {
        for (let x = p.start; x <= p.end; x++) {
            map[p.y][x] = 'S';
            map[p.y - 1][x] = 'c';
        }
    });

    // Exit pipe
    const pipe = (x: number, h: number) => {
        for (let y = height - 2 - h; y < height - 2; y++) {
            map[y][x] = 'P';
            map[y][x+1] = 'P';
        }
    };
    pipe(exitPipeX, 2);

    return map.map(row => row.join(''));
};

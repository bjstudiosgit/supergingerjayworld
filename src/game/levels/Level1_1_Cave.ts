export const width = 50;
export const height = 16;

export const generateMap = (): string[] => {
    const map: string[][] = Array(height).fill(null).map(() => Array(width).fill('.'));

    // Walls and Floor/Ceiling
    for (let x = 0; x < width; x++) {
        map[height - 2][x] = '#'; // Floor layer 1
        map[height - 1][x] = '#'; // Floor layer 2
        if (x !== 1 && x !== 2) {
            map[0][x] = 'S'; // Ceiling
        }
    }
    for (let y = 0; y < height; y++) {
        map[y][0] = 'S'; // Left wall
        map[y][width - 1] = 'S'; // Right wall
    }

    // Platforms with lots of coins
    const layout = [
        { y: 11, start: 5, end: 40 },
        { y: 8, start: 10, end: 35 },
        { y: 5, start: 15, end: 32 }
    ];

    layout.forEach(p => {
        for (let x = p.start; x <= p.end; x++) {
            map[p.y][x] = 'S';
            // Every block has a coin on top
            map[p.y - 1][x] = 'c';
        }
    });

    // Fill the floor with coins too
    for (let x = 5; x < 42; x++) {
        map[height - 3][x] = 'c';
    }

    // Exit pipe
    const pipe = (x: number, h: number) => {
        for (let y = height - 2 - h; y < height - 2; y++) {
            map[y][x] = 'P';
            map[y][x+1] = 'P';
        }
    };
    pipe(44, 2);

    return map.map(row => row.join(''));
};

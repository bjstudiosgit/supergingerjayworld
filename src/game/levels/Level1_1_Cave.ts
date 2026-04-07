export const width = 50;
export const height = 16;

export const generateMap = (): string[] => {
    const map: string[][] = Array(height).fill(null).map(() => Array(width).fill('.'));

    for (let x = 0; x < width; x++) {
        map[14][x] = '#';
        map[15][x] = '#';
        map[0][x] = '#';
    }
    for (let y = 0; y < height; y++) {
        map[y][0] = '#';
        map[y][width - 1] = '#';
    }
    
    // Add some coins
    for (let x = 10; x < 40; x += 5) {
        map[7][x] = 'c';
    }

    // Exit pipe
    const pipe = (x: number, h: number) => {
        for (let y = 14 - h; y < 14; y++) {
            map[y][x] = 'P';
            map[y][x+1] = 'P';
        }
    };
    pipe(42, 3);

    return map.map(row => row.join(''));
};

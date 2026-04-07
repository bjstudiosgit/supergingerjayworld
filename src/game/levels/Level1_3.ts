export const width = 100;
export const height = 16;

export const generateMap = (): string[] => {
    const map: string[][] = Array(height).fill(null).map(() => Array(width).fill('.'));

    for (let x = 0; x < width; x++) {
        map[14][x] = '#'; // Castle floor
        map[15][x] = '#';
    }

    const place = (x: number, y: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            if (x + i < width) map[y][x + i] = str[i];
        }
    };

    // Boss arena
    place(10, 10, 'BBBB');
    place(20, 6, 'BBBB');
    place(30, 10, 'BBBB');
    place(40, 6, 'BBBB');

    // End wall
    for(let y=0; y<=13; y++) map[y][width - 1] = '#';

    return map.map(row => row.join(''));
};

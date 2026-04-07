export const width = 150;
export const height = 16;

export const generateMap = (): string[] => {
    const map: string[][] = Array(height).fill(null).map(() => Array(width).fill('.'));

    for (let x = 0; x < width; x++) {
        map[14][x] = '#';
        map[15][x] = '#';
    }

    const gaps = [20, 21, 22, 50, 51, 52, 53, 80, 81, 82, 110, 111];
    gaps.forEach(x => {
        map[14][x] = '.';
        map[15][x] = '.';
    });

    const place = (x: number, y: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            if (x + i < width) map[y][x + i] = str[i];
        }
    };

    place(10, 10, 'BB?BB');
    place(30, 8, 'BBBB');
    place(40, 5, 'B?B');
    
    place(60, 11, 'S');
    place(62, 9, 'S');
    place(64, 7, 'S');
    place(66, 5, 'S');

    place(90, 10, 'BB?BB');
    
    place(130, 3, 'F');
    for(let y=4; y<=13; y++) map[y][130] = 'f';

    return map.map(row => row.join(''));
};

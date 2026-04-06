export interface Entity {
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    onGround: boolean;
    isPlayer?: boolean;
}

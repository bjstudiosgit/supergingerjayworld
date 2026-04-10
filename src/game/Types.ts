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

export interface EnemyEntity extends Entity {
    alive: boolean;
    hp?: number;
    update(): void;
    draw(ctx: CanvasRenderingContext2D, camX: number): void;
}

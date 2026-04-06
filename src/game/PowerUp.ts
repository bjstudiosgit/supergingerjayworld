import { CONFIG } from './Constants';

export class Mushroom {
    x: number;
    y: number;
    vx: number = 2;
    vy: number = 0;
    w: number = 20;
    h: number = 20;
    active: boolean = true;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    update() {
        this.vy += CONFIG.gravity;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.active) return;
        const drawX = this.x - camX;
        const drawY = this.y;

        // Stem
        ctx.fillStyle = "#27AE60";
        ctx.fillRect(drawX + 8, drawY + 8, 4, 12);

        // Flower Head
        ctx.fillStyle = "#E74C3C";
        ctx.beginPath();
        ctx.arc(drawX + 10, drawY + 6, 8, 0, Math.PI * 2);
        ctx.fill();

        // Center
        ctx.fillStyle = "#F1C40F";
        ctx.beginPath();
        ctx.arc(drawX + 10, drawY + 6, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

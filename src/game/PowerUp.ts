import { CONFIG } from './Constants';

export class Mushroom {
    x: number;
    y: number;
    vx: number = 1.0;
    vy: number = -4; // Small pop up when spawned
    w: number = 20;
    h: number = 20;
    active: boolean = true;
    onGround: boolean = false;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    update() {
        // Logics like animations would go here
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.active) return;
        ctx.fillStyle = "#2ecc71"; // green mushroom
        ctx.fillRect(this.x - camX, this.y, this.w, this.h);
        
        // Mushroom spots
        ctx.fillStyle = "white";
        ctx.fillRect(this.x - camX + 4, this.y + 4, 4, 4);
        ctx.fillRect(this.x - camX + 12, this.y + 4, 4, 4);
        ctx.fillRect(this.x - camX + 8, this.y + 12, 4, 4);
    }
}

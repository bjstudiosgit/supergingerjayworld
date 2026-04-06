import { Enemy } from './Enemy';
import { CONFIG } from './Constants';

export class Bully extends Enemy {
    timer: number = 0;

    constructor(x: number, y: number) {
        super(x, y, "BULLY", "#E74C3C");
        this.vx = -3;
        this.w = 36;
        this.h = 36;
    }

    update() {
        if (!this.active) return;
        super.update();
        this.timer++;
        
        // Jump occasionally
        if (this.timer % 120 === 0 && this.onGround) {
            this.vy = -8;
            this.onGround = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.alive) return;
        const drawX = this.x - camX;
        const drawY = this.y;

        ctx.fillStyle = this.color;
        ctx.fillRect(drawX, drawY, this.w, this.h);
        
        // Horns
        ctx.fillStyle = "#000";
        ctx.fillRect(drawX + 4, drawY - 8, 8, 8);
        ctx.fillRect(drawX + this.w - 12, drawY - 8, 8, 8);
    }
}

import { CONFIG } from './Constants';
import { Entity } from './Types';

export class Coin implements Entity {
    x: number;
    y: number;
    w: number = 16;
    h: number = 24;
    vx: number;
    vy: number;
    onGround: boolean = false;
    active: boolean = true;
    animTimer: number = 0;

    constructor(x: number, y: number, vx: number, vy: number) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }

    update() {
        this.vy += CONFIG.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.animTimer++;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.active) return;
        
        const drawX = this.x - camX;
        const drawY = this.y;
        
        // Simple spinning animation by scaling width
        const scaleX = Math.abs(Math.sin(this.animTimer * 0.1));
        const currentW = this.w * scaleX;
        const offsetX = (this.w - currentW) / 2;

        ctx.fillStyle = "#F1C40F";
        ctx.beginPath();
        ctx.ellipse(drawX + this.w/2, drawY + this.h/2, currentW/2, this.h/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#D4AC0D";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner detail
        if (scaleX > 0.3) {
            ctx.fillStyle = "#D4AC0D";
            ctx.fillRect(drawX + this.w/2 - 2 * scaleX, drawY + 6, 4 * scaleX, this.h - 12);
        }
    }
}

import { Entity } from './Types';

export class Enemy implements Entity {
    x: number;
    y: number;
    w: number = 32;
    h: number = 32;
    vx: number = -1;
    vy: number = 0;
    onGround: boolean = false;
    name: string;
    color: string;
    alive: boolean = true;
    active: boolean = false;
    walkTimer: number = 0;

    constructor(x: number, y: number, name: string, color: string) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.color = color;
    }

    update() {
        if (!this.alive || !this.active) return;
        this.x += this.vx;
        this.walkTimer++;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.alive) return;

        const drawX = this.x - camX;
        const drawY = this.y;
        const bounce = Math.sin(this.walkTimer / 5) * 2;

        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.ellipse(drawX + this.w / 2, drawY + this.h, this.w / 2 - 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(drawX, drawY + bounce);

        // Body (Margs)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, this.h);
        ctx.lineTo(this.w, this.h);
        ctx.lineTo(this.w - 4, 8);
        ctx.lineTo(this.w / 2, 0);
        ctx.lineTo(4, 8);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(6, 12, 8, 8);
        ctx.fillRect(18, 12, 8, 8);

        // Pupils (looking in direction of movement)
        ctx.fillStyle = "#000000";
        const pupilOffset = this.vx > 0 ? 4 : 0;
        ctx.fillRect(6 + pupilOffset, 14, 4, 4);
        ctx.fillRect(18 + pupilOffset, 14, 4, 4);

        // Angry Eyebrows
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(4, 10);
        ctx.lineTo(14, 14);
        ctx.lineTo(14, 12);
        ctx.lineTo(4, 8);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(28, 10);
        ctx.lineTo(18, 14);
        ctx.lineTo(18, 12);
        ctx.lineTo(28, 8);
        ctx.fill();

        // Feet
        ctx.fillStyle = "#000000";
        const foot1 = Math.sin(this.walkTimer / 5) > 0 ? 0 : -4;
        const foot2 = Math.sin(this.walkTimer / 5) < 0 ? 0 : -4;
        ctx.fillRect(4, this.h - 4 + foot1, 10, 4);
        ctx.fillRect(18, this.h - 4 + foot2, 10, 4);

        ctx.restore();

        // Name Tag
        ctx.fillStyle = "white";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(this.name, drawX + this.w / 2, drawY - 8 + bounce);
        ctx.textAlign = "left"; // reset
    }
}

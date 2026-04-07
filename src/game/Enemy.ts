import { EnemyEntity } from './Types';

export class Enemy implements EnemyEntity {
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
    walkTimer: number = 0;

    constructor(x: number, y: number, name: string, color: string) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.color = color;
    }

    update() {
        if (!this.alive) return;
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

export class Bouncer extends Enemy {
    hp: number = 3;
    jumpTimer: number = 0;

    constructor(x: number, y: number) {
        super(x, y, "BOUNCER", "#E74C3C");
        this.w = 64;
        this.h = 64;
        this.vx = -1.5;
    }

    update() {
        if (!this.alive) return;
        this.x += this.vx;
        this.walkTimer++;
        this.jumpTimer++;

        if (this.onGround && this.jumpTimer > 60) {
            this.vy = -12; // Big jump
            this.jumpTimer = 0;
            this.onGround = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.alive) return;

        const drawX = this.x - camX;
        const drawY = this.y;
        
        ctx.save();
        ctx.translate(drawX, drawY);

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.w / 2, this.h / 2, this.w / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(this.w / 3, this.h / 3, 8, 0, Math.PI * 2);
        ctx.arc(2 * this.w / 3, this.h / 3, 8, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = "#000000";
        const pupilOffset = this.vx > 0 ? 4 : -4;
        ctx.beginPath();
        ctx.arc(this.w / 3 + pupilOffset, this.h / 3, 4, 0, Math.PI * 2);
        ctx.arc(2 * this.w / 3 + pupilOffset, this.h / 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Angry Eyebrows
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.w / 3 - 10, this.h / 3 - 10);
        ctx.lineTo(this.w / 3 + 10, this.h / 3 - 5);
        ctx.moveTo(2 * this.w / 3 + 10, this.h / 3 - 10);
        ctx.lineTo(2 * this.w / 3 - 10, this.h / 3 - 5);
        ctx.stroke();

        ctx.restore();

        // Name Tag
        ctx.fillStyle = "white";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${this.name} (HP: ${this.hp})`, drawX + this.w / 2, drawY - 10);
        ctx.textAlign = "left";
    }
}

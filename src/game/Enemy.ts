import { EnemyEntity } from './Types';

export class Enemy implements EnemyEntity {
    x: number;
    y: number;
    w: number = 32;
    h: number = 32;
    vx: number = -0.5;
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
        const bounce = Math.sin(this.walkTimer / 10) * 2;

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
        const foot1 = Math.sin(this.walkTimer / 10) > 0 ? 0 : -4;
        const foot2 = Math.sin(this.walkTimer / 10) < 0 ? 0 : -4;
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
    hp: number = 5;
    isBoss: boolean = true;
    isDefeated: boolean = false;
    jumpTimer: number = 0;
    patrolTimer: number = 0;
    startX: number;

    constructor(x: number, y: number) {
        super(x, y, "BOUNCER", "#E74C3C");
        this.w = 64;
        this.h = 64;
        this.vx = -0.8;
        this.startX = x;
    }

    defeatTimer: number = 0;

    update() {
        if (!this.alive) return;

        if (this.hp <= 0) {
            this.isDefeated = true;
            if (this.defeatTimer === 0) {
                new Audio('/soundeffects/nightmare.mp3').play().catch(() => {});
            }
            this.defeatTimer++;
            
            // Wait for about 10 seconds (600 frames) before running off
            if (this.defeatTimer > 600) {
                this.vx = 8; 
                this.x += this.vx;
            } else {
                this.vx = 0; // Stay still while 'nightmare' plays
            }
            return;
        }

        this.x += this.vx;
        this.walkTimer++;
        this.patrolTimer++;

        // Basic patrol: flip every 180 frames or if hit by wall (via Collision)
        if (this.patrolTimer > 180) {
            this.vx *= -1;
            this.patrolTimer = 0;
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.alive) return;

        const drawX = this.x - camX;
        const drawY = this.y;
        
        ctx.save();
        ctx.translate(drawX, drawY);

        // Flash red if hit? (Maybe just keep it simple)

        // Body
        ctx.fillStyle = this.isDefeated ? "#95A5A6" : this.color; // Grey when defeated
        ctx.beginPath();
        ctx.arc(this.w / 2, this.h / 2, this.w / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(this.w / 3, this.h / 3, 10, 0, Math.PI * 2);
        ctx.arc(2 * this.w / 3, this.h / 3, 10, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = "#000000";
        const pupilOffset = this.vx > 0 ? 5 : -5;
        ctx.beginPath();
        ctx.arc(this.w / 3 + pupilOffset, this.h / 3, 5, 0, Math.PI * 2);
        ctx.arc(2 * this.w / 3 + pupilOffset, this.h / 3, 5, 0, Math.PI * 2);
        ctx.fill();

        // Angry Eyebrows
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 5;
        ctx.beginPath();
        if (this.isDefeated) {
            // Sad eyebrows
            ctx.moveTo(this.w / 3 - 12, this.h / 3 - 5);
            ctx.lineTo(this.w / 3 + 12, this.h / 3 - 15);
            ctx.moveTo(2 * this.w / 3 + 12, this.h / 3 - 5);
            ctx.lineTo(2 * this.w / 3 - 12, this.h / 3 - 15);
        } else {
            ctx.moveTo(this.w / 3 - 12, this.h / 3 - 15);
            ctx.lineTo(this.w / 3 + 12, this.h / 3 - 5);
            ctx.moveTo(2 * this.w / 3 + 12, this.h / 3 - 15);
            ctx.lineTo(2 * this.w / 3 - 12, this.h / 3 - 5);
        }
        ctx.stroke();

        // Mouth
        ctx.beginPath();
        if (this.isDefeated) {
            ctx.arc(this.w / 2, 2 * this.h / 3 + 10, 10, Math.PI, 0); // Frown
        } else {
            ctx.arc(this.w / 2, 2 * this.h / 3, 15, 0, Math.PI); // Smile/Grimace
        }
        ctx.stroke();

        ctx.restore();

        // HP Bar or Tag
        if (!this.isDefeated) {
            ctx.fillStyle = "white";
            ctx.font = "bold 16px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`${this.name} HP: ${this.hp}`, drawX + this.w / 2, drawY - 15);
            
            // Draw HP bar
            ctx.fillStyle = "red";
            ctx.fillRect(drawX, drawY - 40, this.w, 8);
            ctx.fillStyle = "green";
            ctx.fillRect(drawX, drawY - 40, this.w * (this.hp / 5), 8);
            ctx.strokeStyle = "black";
            ctx.strokeRect(drawX, drawY - 40, this.w, 8);
        }
    }
}

export class Cookie extends Enemy {
    constructor(x: number, y: number) {
        super(x, y, "COOKIE", "#3498DB");
        this.w = 32;
        this.h = 24; // Shorter
        this.vx = -0.8; // Faster!
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.alive) return;

        const drawX = this.x - camX;
        const drawY = this.y;
        const wiggle = Math.sin(this.walkTimer / 6) * 3; // Fast wiggle sideways

        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.ellipse(drawX + this.w / 2, drawY + this.h, this.w / 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(drawX + wiggle, drawY);

        // Body (Blocky tank-like shape)
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 8, this.w, this.h - 8);  // Main lower block
        ctx.fillStyle = "#2980B9"; // Darker blue top
        ctx.fillRect(4, 0, this.w - 8, 8);   // Top dome/hatch

        // Track / wheels
        ctx.fillStyle = "#2C3E50";
        const wheelSpin = (this.walkTimer % 20) > 10 ? 0 : 2;
        ctx.fillRect(0, this.h - 4, 8, 4);
        ctx.fillRect(12, this.h - 4 + wheelSpin, 8, 4);
        ctx.fillRect(24, this.h - 4, 8, 4);

        // Eye slit / Visor
        ctx.fillStyle = "#000000";
        ctx.fillRect(4, 10, this.w - 8, 4);

        // Red glowing eye scanning
        ctx.fillStyle = "#E74C3C";
        const eyeWander = Math.sin(this.walkTimer / 10) * 8;
        ctx.fillRect(this.w / 2 - 2 + eyeWander, 10, 4, 4);

        ctx.restore();

        // Name Tag
        ctx.fillStyle = "white";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(this.name, drawX + this.w / 2, drawY - 4);
        ctx.textAlign = "left"; // reset
    }
}

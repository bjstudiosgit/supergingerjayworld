import { EnemyEntity } from './Types';
import { playSound } from './Sound';
import { TILE } from './Constants';

const createImage = (src: string): HTMLImageElement => {
    const img = new Image();
    img.src = src;
    return img;
};

const ENEMY_ANIMATIONS: Record<string, {
    walk: HTMLImageElement[],
    die?: HTMLImageElement[],
    frameCount: number,
    deathFrames?: number
}> = {
    "MARGS": {
        walk: [
            createImage('/motion/margs/margs1.png'),
            createImage('/motion/margs/margs2.png'),
            createImage('/motion/margs/margs3.png'),
            createImage('/motion/margs/margs4.png')
        ],
        die: Array.from({ length: 8 }, (_, i) => createImage(`/motion/margs/margsdie${i + 1}.png`)),
        frameCount: 4,
        deathFrames: 8
    },
    "AMPO": {
        walk: [
            createImage('/motion/ampo/ampo1.png'),
            createImage('/motion/ampo/ampo2.png'),
            createImage('/motion/ampo/ampo3.png'),
            createImage('/motion/ampo/ampo4.png')
        ],
        die: Array.from({ length: 8 }, (_, i) => createImage(`/motion/ampo/ampodie${i + 1}.png`)),
        frameCount: 4,
        deathFrames: 8
    },
    "COOKIE": {
        walk: [
            createImage('/motion/cookie/cookieleft1.png'),
            createImage('/motion/cookie/cookieleft2.png'),
            createImage('/motion/cookie/cookieleft3.png'),
            createImage('/motion/cookie/cookieleft4.png')
        ],
        die: [
            createImage('/motion/cookie/cookieleft1.png'),
            createImage('/motion/cookie/cookieleft2.png'),
            createImage('/motion/cookie/cookieleft3.png'),
            createImage('/motion/cookie/cookieleft4.png')
        ],
        frameCount: 4,
        deathFrames: 4
    }
};

export function triggerDeath(e: Enemy) {
    const anim = ENEMY_ANIMATIONS[e.name];
    const hasDeathAnim = !!anim?.die;

    if (hasDeathAnim) {
        e.isDying = true;
        e.deathTimer = 0;
        e.vx = 0;
    } else {
        e.alive = false;
    }
}

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
    isDying: boolean = false;

    deathTimer: number = 0;
    walkTimer: number = 0;

    constructor(x: number, y: number, name: string, color: string) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.color = color;
    }

    update() {
        if (!this.alive) return;

        if (this.isDying) {
            this.deathTimer++;
            const anim = ENEMY_ANIMATIONS[this.name];
            const maxFrames = anim?.deathFrames ?? 8;
            const duration = maxFrames * 5;

            if (this.deathTimer > duration) {
                this.alive = false;
            }
            return;
        }

        this.walkTimer++;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number, camY: number = 0) {
        if (!this.alive) return;

        const anim = ENEMY_ANIMATIONS[this.name];

        const drawX = this.x - camX;
        const drawY = this.y - camY;

        const bounce = this.isDying ? 0 : Math.sin(this.walkTimer / 10) * 2;

        ctx.save();

        // Flip
        if (this.vx > 0) {
            ctx.translate(drawX + this.w, drawY + bounce);
            ctx.scale(-1, 1);
            ctx.translate(-drawX, -(drawY + bounce));
        }

        ctx.translate(drawX, drawY + bounce);

        if (this.isDying && anim?.die) {
            const frame = Math.min(
                (anim.deathFrames ?? 8) - 1,
                Math.floor(this.deathTimer / 5)
            );

            const img = anim.die[frame];

            if (img?.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -8, -8, this.w + 16, this.h + 16);
            } else {
                // Fallback: Squish the first walk frame
                const walkImg = anim.walk[0];
                if (walkImg?.complete && walkImg.naturalWidth > 0) {
                    const squishFactor = Math.max(0.1, 1 - (this.deathTimer / 20));
                    ctx.drawImage(walkImg, 0, this.h * (1 - squishFactor), this.w, this.h * squishFactor);
                } else {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(0, this.h / 2, this.w, this.h / 2);
                }
            }
        } else if (anim) {
            const frame = Math.floor(this.walkTimer / 10) % anim.frameCount;
            const img = anim.walk[frame];

            if (img?.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, 0, 0, this.w, this.h);
            } else {
                // fallback
                ctx.fillStyle = this.color;
                ctx.fillRect(0, 0, this.w, this.h);
            }
        }

        ctx.restore();

        // Name tag
        ctx.fillStyle = "white";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(this.name, drawX + this.w / 2, drawY - 8);
        ctx.textAlign = "left";
    }
}

export class Walker extends Enemy {
    constructor(x: number, y: number) {
        super(x, y, "AMPO", "#2ECC71");
        this.vx = -0.6;
    }
}

export class Cookie extends Enemy {
    constructor(x: number, y: number) {
        super(x, y, "COOKIE", "#3498DB");
        this.vx = -0.8;
    }
}

export class Bouncer extends Enemy {
    hp: number = 3;
    maxHp: number = 3;
    isBoss: boolean = true;
    isDefeated: boolean = false;
    patrolTimer: number = 0;
    jumpTimer: number = 0;
    attackTimer: number = 0;
    telegraphTimer: number = 0;
    chargeTimer: number = 0;
    hitCooldown: number = 0;
    arenaLeft: number = 202 * TILE;
    arenaRight: number = 232 * TILE;
    moveDirection: -1 | 1 = -1;

    constructor(x: number, y: number) {
        super(x, y, "BOUNCER", "#E74C3C");
        this.w = 48;
        this.h = 48;
        this.vx = -0.65;
    }

    defeatTimer: number = 0;

    get phase() {
        if (this.hp <= 1) return 3;
        if (this.hp <= 2) return 2;
        return 1;
    }

    takeHit() {
        if (this.hitCooldown > 0 || this.hp <= 0) return false;

        this.hp--;
        this.hitCooldown = 36;
        this.telegraphTimer = 0;
        this.chargeTimer = 0;
        this.attackTimer = 0;
        this.moveDirection = this.vx >= 0 ? -1 : 1;
        if (this.hp > 0) {
            this.vx = this.moveDirection * 1.5;
            this.vy = -5;
            this.onGround = false;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
        return true;
    }

    update(targetX?: number) {
        if (!this.alive) return;

        if (this.hitCooldown > 0) this.hitCooldown--;

        if (this.hp <= 0) {
            this.isDefeated = true;
            if (this.defeatTimer === 0) {
                playSound('nightmare');
            }
            this.defeatTimer++;

            // Pause for the win beat, then leave through the now-open exit.
            if (this.defeatTimer > 90) {
                this.vx = 7;
            } else {
                this.vx = 0;
            }

            if (this.defeatTimer > 220) {
                this.alive = false;
                this.vx = 0;
            }

            this.walkTimer += 2;
            return;
        }

        if (this.x <= this.arenaLeft) {
            this.x = this.arenaLeft;
            this.moveDirection = 1;
            this.chargeTimer = 0;
        } else if (this.x + this.w >= this.arenaRight) {
            this.x = this.arenaRight - this.w;
            this.moveDirection = -1;
            this.chargeTimer = 0;
        }

        this.attackTimer++;
        this.jumpTimer++;

        if (this.telegraphTimer > 0) {
            this.telegraphTimer--;
            this.vx = 0;
            this.walkTimer++;

            if (this.telegraphTimer === 0) {
                const bossCenter = this.x + this.w / 2;
                this.moveDirection = targetX !== undefined && targetX < bossCenter ? -1 : 1;
                this.chargeTimer = 32 + this.phase * 6;
                this.vx = this.moveDirection * (2 + this.phase * 0.5);
            }
            return;
        }

        if (this.chargeTimer > 0) {
            this.chargeTimer--;
            this.vx = this.moveDirection * (2 + this.phase * 0.5);
            this.walkTimer += 3;
            return;
        }

        const attackDelay = this.phase === 1 ? 300 : this.phase === 2 ? 250 : 210;
        if (this.attackTimer >= attackDelay && this.onGround) {
            this.attackTimer = 0;
            this.jumpTimer = 0;
            this.telegraphTimer = 50;
            this.vx = 0;
            return;
        }

        const jumpDelay = this.phase === 1 ? 210 : this.phase === 2 ? 165 : 130;
        if (this.jumpTimer >= jumpDelay && this.onGround) {
            this.jumpTimer = 0;
            this.vy = -(8 + this.phase);
            this.onGround = false;
        }

        this.patrolTimer++;
        if (targetX !== undefined && this.patrolTimer >= 60) {
            this.moveDirection = targetX < this.x + this.w / 2 ? -1 : 1;
            this.patrolTimer = 0;
        }

        this.vx = this.moveDirection * (0.5 + this.phase * 0.15);
        this.walkTimer += Math.max(1, Math.abs(this.vx));
    }

    draw(ctx: CanvasRenderingContext2D, camX: number, camY: number = 0) {
        if (!this.alive) return;

        const drawX = this.x - camX;
        const drawY = this.y - camY;
        
        ctx.save();
        ctx.translate(drawX, drawY);

        // Shadow and feet keep the boss grounded and readable at speed.
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.ellipse(this.w / 2, this.h + 4, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(4, this.h - 6, 16, 10);
        ctx.fillRect(this.w - 20, this.h - 6, 16, 10);

        // Body changes colour to clearly telegraph each boss state.
        let bodyColor = this.isDefeated ? "#95A5A6" : this.color;
        if (this.hitCooldown > 0 && Math.floor(this.hitCooldown / 3) % 2 === 0) bodyColor = "#ffffff";
        else if (this.telegraphTimer > 0) bodyColor = "#f1c40f";
        else if (this.chargeTimer > 0) bodyColor = "#c0392b";

        ctx.fillStyle = "#2b0d0d";
        ctx.beginPath();
        ctx.arc(this.w / 2, this.h / 2, this.w / 2 + 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(this.w / 2, this.h / 2, this.w / 2, 0, Math.PI * 2);
        ctx.fill();

        // Fists
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-6, 22, 12, 16);
        ctx.fillRect(this.w - 6, 22, 12, 16);
        ctx.strokeStyle = "#2b0d0d";
        ctx.lineWidth = 3;
        ctx.strokeRect(-6, 22, 12, 16);
        ctx.strokeRect(this.w - 6, 22, 12, 16);

        // Eyes
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(this.w / 3, this.h / 3, 7, 0, Math.PI * 2);
        ctx.arc(2 * this.w / 3, this.h / 3, 7, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = "#000000";
        const pupilOffset = this.vx > 0 ? 3 : -3;
        ctx.beginPath();
        ctx.arc(this.w / 3 + pupilOffset, this.h / 3, 3, 0, Math.PI * 2);
        ctx.arc(2 * this.w / 3 + pupilOffset, this.h / 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Angry brows
        ctx.strokeStyle = "#2b0d0d";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(8, 9);
        ctx.lineTo(20, 14);
        ctx.moveTo(this.w - 8, 9);
        ctx.lineTo(this.w - 20, 14);
        ctx.stroke();

        // Mouth
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 5;
        ctx.beginPath();
        if (this.isDefeated) {
            ctx.arc(this.w / 2, 2 * this.h / 3 + 10, 10, Math.PI, 0);
        } else {
            ctx.arc(this.w / 2, 2 * this.h / 3, 11, 0, Math.PI);
        }
        ctx.stroke();

        if (this.telegraphTimer > 0) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 26px monospace";
            ctx.textAlign = "center";
            ctx.fillText("!", this.w / 2, -18);
        }

        if (this.chargeTimer > 0) {
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 3;
            const trailStart = this.moveDirection > 0 ? -34 : this.w + 10;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(trailStart, 18 + i * 14);
                ctx.lineTo(trailStart + (this.moveDirection > 0 ? 24 : -24), 18 + i * 14);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

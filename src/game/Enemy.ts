import { EnemyEntity } from './Types';
import { playSound } from './Sound';

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
        die: Array.from({ length: 8 }, (_, i) => createImage(`/motion/cookie/cookiedie${i + 1}.png`)),
        frameCount: 4,
        deathFrames: 8
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

        this.x += this.vx;
        this.walkTimer++;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.alive) return;

        const anim = ENEMY_ANIMATIONS[this.name];

        const drawX = this.x - camX;
        const drawY = this.y;

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
    hp: number = 5;
    isBoss: boolean = true;
    isDefeated: boolean = false;
    patrolTimer: number = 0;
    jumpTimer: number = 0;

    constructor(x: number, y: number) {
        super(x, y, "BOUNCER", "#E74C3C");
        this.w = 64;
        this.h = 64;
        this.vx = -1.2; // Slightly faster than before but slower than Bully
    }

    defeatTimer: number = 0;

    update() {
        if (!this.alive) return;

        if (this.hp <= 0) {
            this.isDefeated = true;
            if (this.defeatTimer === 0) {
                console.log("Bouncer defeated, playing nightmare.mp3");
                playSound('nightmare');
            }
            this.defeatTimer++;
            
            if (this.defeatTimer > 600) {
                this.vx = 8; 
                this.x += this.vx;
            } else {
                this.vx = 0;
            }
            return;
        }

        // Bully-like jump logic
        this.jumpTimer++;
        if (this.jumpTimer % 120 === 0 && this.onGround) {
            this.vy = -10;
            this.onGround = false;
        }

        super.update();
        this.patrolTimer++;

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

        // Body
        ctx.fillStyle = this.isDefeated ? "#95A5A6" : this.color;
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

        // Mouth
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 5;
        ctx.beginPath();
        if (this.isDefeated) {
            ctx.arc(this.w / 2, 2 * this.h / 3 + 10, 10, Math.PI, 0);
        } else {
            ctx.arc(this.w / 2, 2 * this.h / 3, 15, 0, Math.PI);
        }
        ctx.stroke();

        ctx.restore();

        if (!this.isDefeated) {
            ctx.fillStyle = "white";
            ctx.font = "bold 16px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`${this.name} HP: ${this.hp}`, drawX + this.w / 2, drawY - 15);
            
            ctx.fillStyle = "red";
            ctx.fillRect(drawX, drawY - 40, this.w, 8);
            ctx.fillStyle = "green";
            ctx.fillRect(drawX, drawY - 40, this.w * (this.hp / 5), 8);
            ctx.strokeStyle = "black";
            ctx.strokeRect(drawX, drawY - 40, this.w, 8);
        }
    }
}

import { Player } from './Player';

const gramsWalkImages = [
    new Image(), new Image(), new Image(), new Image(), new Image(), new Image()
];
gramsWalkImages[0].src = '/motion/grams/walk1.png';
gramsWalkImages[1].src = '/motion/grams/walk2.png';
gramsWalkImages[2].src = '/motion/grams/walk3.png';
gramsWalkImages[3].src = '/motion/grams/walk4.png';
gramsWalkImages[4].src = '/motion/grams/walk5.png';
gramsWalkImages[5].src = '/motion/grams/walk6.png';

const gramsPowerupImages = [
    new Image(), new Image(), new Image(), new Image(), new Image(), new Image()
];
gramsPowerupImages[0].src = '/motion/grams/powerup1.png';
gramsPowerupImages[1].src = '/motion/grams/powerup2.png';
gramsPowerupImages[2].src = '/motion/grams/powerup3.png';
gramsPowerupImages[3].src = '/motion/grams/powerup4.png';
gramsPowerupImages[4].src = '/motion/grams/powerup5.png';
gramsPowerupImages[5].src = '/motion/grams/powerup6.png';

export class GramsPlayer extends Player {
    constructor() {
        super();
        this.characterId = "grams";
        this.w = 48;
        this.h = 72;
    }

    getWalkImages(): HTMLImageElement[] {
        return gramsWalkImages;
    }

    getIdleImage(): HTMLImageElement {
        return gramsWalkImages[0];
    }

    getPowerupWalkImages(): HTMLImageElement[] {
        return gramsPowerupImages;
    }

    getPowerupIdleImage(): HTMLImageElement {
        return gramsPowerupImages[0];
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        ctx.save();

        // Flashing effect if invincible
        if (this.isInvincible) {
            if (Math.floor(this.invincibilityTimer / 5) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.filter = 'brightness(2) sepia(1) hue-rotate(120deg) saturate(5)'; // Different tint (Greenish/Cyan)
            } else {
                ctx.globalAlpha = 0.8;
                ctx.filter = 'brightness(2)';
            }
        }

        let drawX = this.x - camX;
        let drawY = this.y;

        // Flip context if facing left
        if (!this.facingRight) {
            ctx.translate(drawX + this.w / 2, drawY);
            ctx.scale(-1, 1);
            drawX = -this.w / 2;
            drawY = 0;
        }

        const isMoving = Math.abs(this.vx) > 0.3;
        const animationSpeed = this.getAnimationSpeed();
        const walkCycle = Math.floor(this.walkDistance / animationSpeed);

        const bounceAmount = 4;
        const bounce = isMoving ? Math.abs(Math.sin((this.walkDistance / animationSpeed) * Math.PI)) * -bounceAmount : 0;

        const walkImages = (this.state === "big" || this.isInvincible) ? this.getPowerupWalkImages() : this.getWalkImages();
        const idleImage = (this.state === "big" || this.isInvincible) ? this.getPowerupIdleImage() : this.getIdleImage();

        let img = idleImage;
        if (isMoving && walkImages.length > 0) {
            img = walkImages[walkCycle % walkImages.length];
        }

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, drawX, drawY + bounce, this.w, this.h);
        } else {
            ctx.fillStyle = "#00CED1"; // Dark Turquoise fallback for Grams
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

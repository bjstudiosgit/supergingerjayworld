import { Player } from './Player';

const tapped24WalkImages = [
    new Image(), new Image(), new Image(), new Image()
];
tapped24WalkImages[0].src = '/motion/tapped24/walk1.png';
tapped24WalkImages[1].src = '/motion/tapped24/walk2.png';
tapped24WalkImages[2].src = '/motion/tapped24/walk3.png';
tapped24WalkImages[3].src = '/motion/tapped24/walk4.png';

const tapped24PowerupImages = [
    new Image(), new Image(), new Image(), new Image()
];
tapped24PowerupImages[0].src = '/motion/tapped24/powerup1.png';
tapped24PowerupImages[1].src = '/motion/tapped24/powerup2.png';
tapped24PowerupImages[2].src = '/motion/tapped24/powerup3.png';
tapped24PowerupImages[3].src = '/motion/tapped24/powerup4.png';

export class Tapped24Player extends Player {
    constructor() {
        super();
        this.characterId = "tapped24";
        this.w = 48;
        this.h = 72;
        // Standard dynamics
        this.moveSpeed = 3;
        this.jumpImpulse = -10;
    }

    getWalkImages(): HTMLImageElement[] {
        return tapped24WalkImages;
    }

    getIdleImage(): HTMLImageElement {
        return tapped24WalkImages[0];
    }

    getPowerupWalkImages(): HTMLImageElement[] {
        return tapped24PowerupImages;
    }

    getPowerupIdleImage(): HTMLImageElement {
        return tapped24PowerupImages[0];
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        ctx.save();
        
        // Flashing effect if invincible
        if (this.isInvincible) {
            if (Math.floor(this.invincibilityTimer / 5) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.filter = 'brightness(2) sepia(1) hue-rotate(320deg) saturate(5)'; // Different tint (Pinkish/Red)
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
        const animationSpeed = 12; 
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
            ctx.fillStyle = "#FF1493"; // Deep Pink fallback for Tapped24
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

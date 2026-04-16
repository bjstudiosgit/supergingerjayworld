import { Player } from './Player';

const rynoWalkImages = [
    new Image(), new Image(), new Image(), new Image()
];
rynoWalkImages[0].src = '/motion/ryno/walk1.png';
rynoWalkImages[1].src = '/motion/ryno/walk2.png';
rynoWalkImages[2].src = '/motion/ryno/walk3.png';
rynoWalkImages[3].src = '/motion/ryno/walk4.png';

const rynoPowerupImages = [
    new Image(), new Image(), new Image(), new Image()
];
rynoPowerupImages[0].src = '/motion/ryno/powerup1.png';
rynoPowerupImages[1].src = '/motion/ryno/powerup2.png';
rynoPowerupImages[2].src = '/motion/ryno/powerup3.png';
rynoPowerupImages[3].src = '/motion/ryno/powerup4.png';

export class RynoPlayer extends Player {
    constructor() {
        super();
        this.characterId = "ryno";
        this.w = 48;
        this.h = 72;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number, camY: number = 0) {
        ctx.save();
        
        // Flashing effect if invincible
        if (this.isInvincible) {
            if (Math.floor(this.invincibilityTimer / 5) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.filter = 'brightness(2) sepia(1) hue-rotate(270deg) saturate(5)'; // Different tint (Purpleish)
            } else {
                ctx.globalAlpha = 0.8;
                ctx.filter = 'brightness(2)'; 
            }
        }

        let drawX = this.x - camX;
        let drawY = this.y - camY;

        // Flip context if facing left
        if (!this.facingRight) {
            ctx.translate(drawX + this.w / 2, drawY);
            ctx.scale(-1, 1);
            drawX = -this.w / 2;
            drawY = 0;
        }

        const isMoving = Math.abs(this.vx) > 0.5;
        const animationSpeed = this.getAnimationSpeed(); 
        const walkCycle = Math.floor(this.walkDistance / animationSpeed);
        
        const bounceAmount = 4; 
        const bounce = isMoving ? Math.abs(Math.sin((this.walkDistance / animationSpeed) * Math.PI)) * -bounceAmount : 0;

        const images = (this.state === "big" || this.isInvincible) ? rynoPowerupImages : rynoWalkImages;
        const img = images[isMoving ? (walkCycle % 4) : 0];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, drawX, drawY + bounce, this.w, this.h);
        } else {
            ctx.fillStyle = "#808080"; // Gray fallback for Ryno
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

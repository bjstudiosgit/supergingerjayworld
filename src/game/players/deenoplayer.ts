import { Player } from './Player';

const deenoWalkImages = [
    new Image(), new Image(), new Image(), new Image()
];
deenoWalkImages[0].src = '/motion/deeno/walk1.png';
deenoWalkImages[1].src = '/motion/deeno/walk2.png';
deenoWalkImages[2].src = '/motion/deeno/walk3.png';
deenoWalkImages[3].src = '/motion/deeno/walk4.png';

const deenoPowerupImages = [
    new Image(), new Image(), new Image(), new Image()
];
deenoPowerupImages[0].src = '/motion/deeno/powerup1.png';
deenoPowerupImages[1].src = '/motion/deeno/powerup2.png';
deenoPowerupImages[2].src = '/motion/deeno/powerup3.png';
deenoPowerupImages[3].src = '/motion/deeno/powerup4.png';

export class DeenoPlayer extends Player {
    constructor() {
        super();
        this.characterId = "deeno";
        this.w = 48;
        this.h = 72;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        ctx.save();
        
        // Flashing effect if invincible
        if (this.isInvincible) {
            if (Math.floor(this.invincibilityTimer / 5) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.filter = 'brightness(2) sepia(1) hue-rotate(90deg) saturate(5)'; // Different tint (Greenish)
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

        const isMoving = Math.abs(this.vx) > 0.5;
        const animationSpeed = this.getAnimationSpeed(); 
        const walkCycle = Math.floor(this.walkDistance / animationSpeed);
        
        const bounceAmount = 4; 
        const bounce = isMoving ? Math.abs(Math.sin((this.walkDistance / animationSpeed) * Math.PI)) * -bounceAmount : 0;

        const images = (this.state === "big" || this.isInvincible) ? deenoPowerupImages : deenoWalkImages;
        const img = images[isMoving ? (walkCycle % 4) : 0];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, drawX, drawY + bounce, this.w, this.h);
        } else {
            ctx.fillStyle = "#8B4513"; // Brown fallback for Viking
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

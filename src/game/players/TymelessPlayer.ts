import { Player } from './Player';

const tymelessWalkImages = [
    new Image(), new Image(), new Image(), new Image()
];
tymelessWalkImages[0].src = '/motion/tymeless/walk1.png';
tymelessWalkImages[1].src = '/motion/tymeless/walk2.png';
tymelessWalkImages[2].src = '/motion/tymeless/walk3.png';
tymelessWalkImages[3].src = '/motion/tymeless/walk4.png';

const tymelessPowerupImages = [
    new Image(), new Image(), new Image(), new Image()
];
tymelessPowerupImages[0].src = '/motion/tymeless/powerup1.png';
tymelessPowerupImages[1].src = '/motion/tymeless/powerup2.png';
tymelessPowerupImages[2].src = '/motion/tymeless/powerup3.png';
tymelessPowerupImages[3].src = '/motion/tymeless/powerup4.png';

export class TymelessPlayer extends Player {
    constructor() {
        super();
        this.characterId = "tymeless";
        this.w = 48;
        this.h = 72;
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        ctx.save();
        
        // Flashing effect if invincible
        if (this.isInvincible) {
            if (Math.floor(this.invincibilityTimer / 5) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.filter = 'brightness(2) sepia(1) hue-rotate(180deg) saturate(5)'; // Different tint (Blueish)
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

        const images = (this.state === "big" || this.isInvincible) ? tymelessPowerupImages : tymelessWalkImages;
        const img = images[isMoving ? (walkCycle % 4) : 0];

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, drawX, drawY + bounce, this.w, this.h);
        } else {
            ctx.fillStyle = "#00FF00";
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}


import { Player } from './Player';

const tymelessWalkImages = [
    new Image(), new Image(), new Image(), new Image()
];
tymelessWalkImages[0].src = '/motion/tymeless/walk1.png';
tymelessWalkImages[1].src = '/motion/tymeless/walk2.png';
tymelessWalkImages[2].src = '/motion/tymeless/walk3.png';
tymelessWalkImages[3].src = '/motion/tymeless/walk4.png';

const tymelessPowerupImg = new Image();
tymelessPowerupImg.src = '/motion/tymeless/powerup1.png';

export class TymelessPlayer extends Player {
    constructor() {
        super();
        this.characterId = "tymeless";
        this.w = 48;
        this.h = 72;
        // Different dynamics: Slightly faster and higher jump
        this.moveSpeed = 3.5;
        this.jumpImpulse = -12;
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
        const animationSpeed = 12; // Faster animation for faster speed
        const walkCycle = Math.floor(this.walkDistance / animationSpeed);
        
        const bounceAmount = 4; // More bounce
        const bounce = isMoving ? Math.abs(Math.sin((this.walkDistance / animationSpeed) * Math.PI)) * -bounceAmount : 0;

        if (this.state === "big" || this.isInvincible) {
            const img = tymelessPowerupImg;
            if (img.complete && img.naturalWidth > 0) {
                const frameWidth = img.naturalHeight;
                const maxFrames = Math.max(1, Math.floor(img.naturalWidth / frameWidth));
                const frameIndex = isMoving ? (walkCycle % maxFrames) : 0;
                
                ctx.drawImage(
                    img, 
                    frameIndex * frameWidth, 0, frameWidth, img.naturalHeight,
                    drawX, drawY + bounce, this.w, this.h
                );
            } else {
                ctx.fillStyle = "#00FF00";
                ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
            }
        } else {
            const img = tymelessWalkImages[isMoving ? (walkCycle % 4) : 0];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, drawX, drawY + bounce, this.w, this.h);
            } else {
                ctx.fillStyle = "#00FF00";
                ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
            }
        }

        ctx.restore();
    }
}

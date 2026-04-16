import { Player } from './Player';

const romanWalkImages = [
    new Image(), new Image(), new Image(), new Image(),
    new Image(), new Image(), new Image(), new Image()
];
romanWalkImages[0].src = '/motion/Roman/walk1.png';
romanWalkImages[1].src = '/motion/Roman/walk2.png';
romanWalkImages[2].src = '/motion/Roman/walk3.png';
romanWalkImages[3].src = '/motion/Roman/walk4.png';
romanWalkImages[4].src = '/motion/Roman/walk5.png';
romanWalkImages[5].src = '/motion/Roman/walk6.png';
romanWalkImages[6].src = '/motion/Roman/walk7.png';
romanWalkImages[7].src = '/motion/Roman/walk8.png';

const romanPowerupImages = [
    new Image(), new Image(), new Image(), new Image(),
    new Image(), new Image(), new Image(), new Image()
];
romanPowerupImages[0].src = '/motion/Roman/powerup1.png';
romanPowerupImages[1].src = '/motion/Roman/powerup2.png';
romanPowerupImages[2].src = '/motion/Roman/powerup3.png';
romanPowerupImages[3].src = '/motion/Roman/powerup4.png';
romanPowerupImages[4].src = '/motion/Roman/powerup5.png';
romanPowerupImages[5].src = '/motion/Roman/powerup6.png';
romanPowerupImages[6].src = '/motion/Roman/powerup7.png';
romanPowerupImages[7].src = '/motion/Roman/powerup8.png';

export class RomanPlayer extends Player {
    constructor() {
        super();
        this.characterId = "roman";
        this.w = 48;
        this.h = 72;
    }

    getWalkImages(): HTMLImageElement[] {
        return romanWalkImages;
    }

    getIdleImage(): HTMLImageElement {
        return romanWalkImages[0];
    }

    getPowerupWalkImages(): HTMLImageElement[] {
        return romanPowerupImages;
    }

    getPowerupIdleImage(): HTMLImageElement {
        return romanPowerupImages[0];
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        ctx.save();
        
        // Flashing effect if invincible
        if (this.isInvincible) {
            if (Math.floor(this.invincibilityTimer / 5) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.filter = 'brightness(2) sepia(1) hue-rotate(45deg) saturate(5)'; // Different tint (Gold/Yellow)
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

        const walkImages = (this.state === "big" || this.isInvincible) ? this.getPowerupWalkImages() : this.getWalkImages();
        const idleImage = (this.state === "big" || this.isInvincible) ? this.getPowerupIdleImage() : this.getIdleImage();

        let img = idleImage;
        if (isMoving && walkImages.length > 0) {
            img = walkImages[walkCycle % walkImages.length];
        }

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, drawX, drawY + bounce, this.w, this.h);
        } else {
            ctx.fillStyle = "#FFD700"; // Gold fallback for Roman
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

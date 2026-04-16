import { Player } from './Player';

const passiveWalkImages = [
    new Image(), new Image(), new Image(), new Image(),
    new Image(), new Image(), new Image(), new Image()
];
passiveWalkImages[0].src = '/motion/passive/walk1.png';
passiveWalkImages[1].src = '/motion/passive/walk2.png';
passiveWalkImages[2].src = '/motion/passive/walk3.png';
passiveWalkImages[3].src = '/motion/passive/walk4.png';
passiveWalkImages[4].src = '/motion/passive/walk5.png';
passiveWalkImages[5].src = '/motion/passive/walk6.png';
passiveWalkImages[6].src = '/motion/passive/walk7.png';
passiveWalkImages[7].src = '/motion/passive/walk8.png';

const passivePowerupImages = [
    new Image(), new Image(), new Image(), new Image(),
    new Image(), new Image(), new Image(), new Image()
];
passivePowerupImages[0].src = '/motion/passive/powerup1.png';
passivePowerupImages[1].src = '/motion/passive/powerup2.png';
passivePowerupImages[2].src = '/motion/passive/powerup3.png';
passivePowerupImages[3].src = '/motion/passive/powerup4.png';
passivePowerupImages[4].src = '/motion/passive/powerup5.png';
passivePowerupImages[5].src = '/motion/passive/powerup6.png';
passivePowerupImages[6].src = '/motion/passive/powerup7.png';
passivePowerupImages[7].src = '/motion/passive/powerup8.png';

export class PassivePlayer extends Player {
    constructor() {
        super();
        this.characterId = "passive";
        this.w = 48;
        this.h = 72;
    }

    getWalkImages(): HTMLImageElement[] {
        return passiveWalkImages;
    }

    getIdleImage(): HTMLImageElement {
        return passiveWalkImages[0];
    }

    getPowerupWalkImages(): HTMLImageElement[] {
        return passivePowerupImages;
    }

    getPowerupIdleImage(): HTMLImageElement {
        return passivePowerupImages[0];
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        ctx.save();
        
        // Flashing effect if invincible
        if (this.isInvincible) {
            if (Math.floor(this.invincibilityTimer / 5) % 2 === 0) {
                ctx.globalAlpha = 0.5;
                ctx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)'; // Reddish tint
            } else {
                ctx.globalAlpha = 0.8;
                ctx.filter = 'brightness(2)'; // Whitish tint
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
        const animationSpeed = 15; 
        const walkCycle = Math.floor(this.walkDistance / animationSpeed);
        
        // Improved bounce mechanism: smooth sine wave based on walk distance
        const bounceAmount = 3;
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
            ctx.fillStyle = this.state === "big" ? "#0000FF" : "#000000";
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

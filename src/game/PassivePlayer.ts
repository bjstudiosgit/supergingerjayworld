import { Player } from './Player';

const passiveWalkImages = [
    new Image(), new Image(), new Image(), new Image()
];
passiveWalkImages[0].src = '/motion/passive/passive1.png';
passiveWalkImages[1].src = '/motion/passive/passive2.png';
passiveWalkImages[2].src = '/motion/passive/passive3.png';
passiveWalkImages[3].src = '/motion/passive/passive4.png';

const passivePowerupImg = new Image();
passivePowerupImg.src = '/music/characters/passivespritepowerup.png';

export class PassivePlayer extends Player {
    constructor() {
        super();
        this.characterId = "passive";
        this.w = 48;
        this.h = 72;
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

        const isMoving = Math.abs(this.vx) > 0.5;
        const animationSpeed = 15; 
        const walkCycle = Math.floor(this.walkDistance / animationSpeed);
        
        // Improved bounce mechanism: smooth sine wave based on walk distance
        const bounceAmount = 3;
        const bounce = isMoving ? Math.abs(Math.sin((this.walkDistance / animationSpeed) * Math.PI)) * -bounceAmount : 0;

        if (this.state === "big") {
            const img = passivePowerupImg;
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
                ctx.fillStyle = "#0000FF";
                ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
            }
        } else {
            const img = passiveWalkImages[isMoving ? (walkCycle % 4) : 0];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, drawX, drawY + bounce, this.w, this.h);
            } else {
                ctx.fillStyle = "#000000";
                ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
            }
        }

        ctx.restore();
    }
}

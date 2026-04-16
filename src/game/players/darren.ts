import { Player } from './Player';

const darrenWalkImages = [
    new Image(), new Image(), new Image(), new Image()
];
darrenWalkImages[0].src = '/motion/darren/walk1.png';
darrenWalkImages[1].src = '/motion/darren/walk2.png';
darrenWalkImages[2].src = '/motion/darren/walk3.png';
darrenWalkImages[3].src = '/motion/darren/walk4.png';

const darrenGloveImages = [
    new Image(), new Image(), new Image(), new Image()
];
darrenGloveImages[0].src = '/motion/darren/powerup1.png';
darrenGloveImages[1].src = '/motion/darren/powerup2.png';
darrenGloveImages[2].src = '/motion/darren/powerup3.png';
darrenGloveImages[3].src = '/motion/darren/powerup4.png';


export class DarrenPlayer extends Player {
    constructor() {
        super();
        this.characterId = "darren";
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

        if (this.state === "big" || this.isInvincible) {
            const img = darrenGloveImages[isMoving ? (walkCycle % 4) : 0];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, drawX, drawY + bounce, this.w, this.h);
            } else {
                ctx.fillStyle = "#FF0000";
                ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
            }
        } else {
            const img = darrenWalkImages[isMoving ? (walkCycle % 4) : 0];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, drawX, drawY + bounce, this.w, this.h);
            } else {
                ctx.fillStyle = "#3E2723";
                ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
            }
        }

        ctx.restore();
    }
}

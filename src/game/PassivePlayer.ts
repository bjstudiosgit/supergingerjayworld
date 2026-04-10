import { Player } from './Player';

const passiveImg = new Image();
passiveImg.src = '/music/characters/passivesprite.png';
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
        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.ellipse(this.x - camX + this.w / 2, this.y + this.h, this.w / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        
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
        const walkCycle = Math.floor(this.walkDistance / 12) % 4;
        const bounce = isMoving ? (walkCycle % 2 === 0 ? 0 : -2) : Math.sin(Date.now() / 200) * 1;

        const img = this.state === "big" ? passivePowerupImg : passiveImg;
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
            ctx.fillStyle = this.state === "big" ? "#0000FF" : "#000000";
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

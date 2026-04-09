import { Player } from './Player';

const darrenImg = new Image();
darrenImg.src = '/music/characters/darren.png';
const darrenPowerupImg = new Image();
darrenPowerupImg.src = '/music/characters/darrenpowerup.png';

export class DentistPlayer extends Player {
    constructor() {
        super();
        this.characterId = "dentist";
        this.w = 48;
        this.h = 64;
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

        const img = this.state === "big" ? darrenPowerupImg : darrenImg;
        if (img.complete && img.naturalWidth > 0) {
            // Assume the sprite sheet consists of square frames (width = height)
            const frameWidth = img.naturalHeight;
            // Use the walkCycle to pick a frame from the sprite sheet
            const maxFrames = Math.floor(img.naturalWidth / frameWidth);
            const frameIndex = isMoving ? (walkCycle % maxFrames) : 0; // Frame 0 for idle
            
            ctx.drawImage(
                img, 
                frameIndex * frameWidth, 0, frameWidth, img.naturalHeight, // Source rectangle
                drawX, drawY + bounce, this.w, this.h // Destination rectangle
            );
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = this.state === "big" ? "#ff0000" : "#3E2723";
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

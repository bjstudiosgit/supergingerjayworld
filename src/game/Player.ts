import { CONFIG } from './Constants';
import { Entity } from './Types';

const jayImg = new Image();
jayImg.src = '/music/characters/jaysprite.png';

export class Player implements Entity {
    isPlayer = true;
    characterId: string = "ginja"; // Default to ginja
    x: number = 100;
    y: number = 400;
    w: number = 48;
    h: number = 72;
    vx: number = 0;
    vy: number = 0;
    onGround: boolean = false;
    state: "small" | "big" = "small";
    facingRight: boolean = true;
    walkDistance: number = 0;

    grow() {
        if (this.state === "small") {
            this.state = "big";
            // Do not change height or y position so the player doesn't float
        }
    }

    shrink() {
        if (this.state === "big") {
            this.state = "small";
            // Do not change height or y position
        }
    }

    update(keys: Record<string, boolean>) {
        if (keys['KeyD'] || keys['ArrowRight']) {
            this.vx = CONFIG.moveSpeed;
            this.facingRight = true;
            this.walkDistance += Math.abs(this.vx);
        }
        else if (keys['KeyA'] || keys['ArrowLeft']) {
            this.vx = -CONFIG.moveSpeed;
            this.facingRight = false;
            this.walkDistance += Math.abs(this.vx);
        }
        else {
            this.vx *= CONFIG.friction;
            this.walkDistance = 0;
        }

        // Prevent moving left of 0
        if (this.x < 0) {
            this.x = 0;
            if (this.vx < 0) this.vx = 0;
        }

        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && this.onGround) {
            this.vy = CONFIG.jumpImpulse;
            this.onGround = false;
        }
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

        if (jayImg.complete && jayImg.naturalWidth > 0) {
            // Assume the sprite sheet consists of square frames (width = height)
            // Or if it's a single image, maxFrames will be 1 or similar
            const frameWidth = jayImg.naturalHeight;
            const maxFrames = Math.max(1, Math.floor(jayImg.naturalWidth / frameWidth));
            const frameIndex = isMoving ? (walkCycle % maxFrames) : 0; // Frame 0 for idle
            
            ctx.drawImage(
                jayImg, 
                frameIndex * frameWidth, 0, frameWidth, jayImg.naturalHeight, // Source rectangle
                drawX, drawY + bounce, this.w, this.h // Destination rectangle
            );
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = this.state === "big" ? "#F1C40F" : "#E59866";
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

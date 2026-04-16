import { CONFIG } from '../Constants';
import { Entity } from '../Types';

const createImage = (src: string): HTMLImageElement => {
    const img = new Image();
    img.src = src;
    return img;
};


const jayWalkImages = [
    createImage('/motion/gingerjay/walk1.png'),
    createImage('/motion/gingerjay/walk2.png'),
    createImage('/motion/gingerjay/walk3.png'),
    createImage('/motion/gingerjay/walk4.png'),
];

const jayPowerupImages = [
    createImage('/motion/gingerjay/powerup1.png'),
    createImage('/motion/gingerjay/powerup2.png'),
    createImage('/motion/gingerjay/powerup3.png'),
    createImage('/motion/gingerjay/powerup4.png'),
];

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
    isInvincible: boolean = false;
    invincibilityTimer: number = 0;
    
    // Dynamics that can be overridden by subclasses
    moveSpeed: number = CONFIG.moveSpeed;
    jumpImpulse: number = CONFIG.jumpImpulse;

    // Subclasses can override these to provide their own images
    getWalkImages(): HTMLImageElement[] {
        return jayWalkImages;
    }

    getIdleImage(): HTMLImageElement {
        return jayWalkImages[0];
    }

    getPowerupWalkImages(): HTMLImageElement[] {
        return jayPowerupImages;
    }

    getPowerupIdleImage(): HTMLImageElement {
        return jayPowerupImages[0];
    }

    getAnimationSpeed(): number {
        return (Math.abs(this.vx) > this.moveSpeed * 1.1) ? 8 : 12;
    }

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
        if (this.isInvincible) {
            this.invincibilityTimer++;
            // 15 seconds at 60fps = 900 frames
            if (this.invincibilityTimer > 900) {
                this.isInvincible = false;
                this.invincibilityTimer = 0;
            }
        }

        const isRunning = keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyB'];
        const runMultiplier = isRunning ? 1.6 : 1.0;

        const accel = (this.onGround ? 0.3 : 0.2) * runMultiplier;
        const maxSpeed = this.moveSpeed * runMultiplier;
        const friction = 0.8;
        const moveThreshold = 0.3;

        const moveRight = keys['KeyD'] || keys['ArrowRight'];
        const moveLeft = keys['KeyA'] || keys['ArrowLeft'];

        const speedRatio = Math.abs(this.vx) / maxSpeed;
        const turnSpeed = 1.2; // aggressive turn force

        if (moveRight) {
            if (this.vx < 0) {
                this.vx = 0; // 💥 quick stop when changing dir
            }
            this.vx += accel;
            this.facingRight = true;
        }
        if (moveLeft) {
            if (this.vx > 0) {
                this.vx = 0; // 💥 same here
            }
            this.vx -= accel;
            this.facingRight = false;
        }

        // Clamp speed
        this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

        // Apply friction when no input
        if (!moveLeft && !moveRight) {
            this.vx *= friction;

            if (Math.abs(this.vx) < 0.2) {
                this.vx = 0;
            }
        }

        // Update walk distance for animation
        if (Math.abs(this.vx) > moveThreshold) {
            this.walkDistance += Math.abs(this.vx);
        } else {
            this.walkDistance = 0;
        }

        // Prevent moving left of 0
        if (this.x < 0) {
            this.x = 0;
            if (this.vx < 0) this.vx = 0;
        }

        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && this.onGround) {
            this.vy = this.jumpImpulse;
            this.onGround = false;
        }
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
        const animationSpeed = this.getAnimationSpeed();
        const walkCycle = Math.floor(this.walkDistance / animationSpeed);
        
        // Improved bounce mechanism: smooth sine wave based on walk distance
        const bounceAmount = 3;
        const bounce = isMoving ? Math.abs(Math.sin((this.walkDistance / animationSpeed) * Math.PI)) * -bounceAmount : 0;

        const walkImages = (this.state === "big" || this.isInvincible) ? this.getPowerupWalkImages() : this.getWalkImages();
        const idleImage = (this.state === "big" || this.isInvincible) ? this.getPowerupIdleImage() : this.getIdleImage();

        let currentImg = idleImage;

        if (isMoving && walkImages.length > 0) {
            // Cycle through available walk images
            // Pattern: 0, 1, 2, 3, 0, 1, 2, 3...
            const frameIndex = walkCycle % walkImages.length;
            currentImg = walkImages[frameIndex];
        }

        if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
            // Draw the individual image frame
            ctx.drawImage(
                currentImg, 
                drawX, drawY + bounce, this.w, this.h
            );
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = this.state === "big" ? "#F1C40F" : "#E59866";
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

import { CONFIG } from '../Constants';
import { Entity } from '../Types';
import { characterProfiles } from './CharacterProfiles';
import { playSound } from '../Sound';

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
const jayAttackImages = [1, 2, 3].map(i => createImage(`/motion/gingerjay/attack${i}.png`));

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
    invincibilityDurationFrames: number = 1200; // 20 seconds at 60fps
    invincibilitySpeedMultiplier: number = 1.2;
    hurtCooldown: number = 0;
    jumpHeld: boolean = false;
    coyoteFrames = 0;
    jumpBufferFrames = 0;
    jumpInProgress = false;
    attackHeld = false;
    attackTimer = 0;
    attackCooldown = 0;
    attackTargets = new Set<object>();
    powerFlash = 0;

    get profile() {
        return characterProfiles[this.characterId as keyof typeof characterProfiles] ?? characterProfiles.ginja;
    }

    resetActions() {
        this.jumpHeld = false;
        this.coyoteFrames = 0;
        this.jumpBufferFrames = 0;
        this.jumpInProgress = false;
        this.attackHeld = false;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.attackTargets.clear();
        this.powerFlash = 0;
    }

    getAttackBox() {
        if ((this.state !== 'big' && !this.isInvincible) || this.attackTimer <= 0) return null;
        return { x: this.facingRight ? this.x + this.w - 8 : this.x - this.profile.range + 8,
            y: this.y + 8, w: this.profile.range, h: this.h - 8 };
    }

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
            this.powerFlash = 30;
            this.hurtCooldown = Math.max(this.hurtCooldown, 30);
            // Do not change height or y position so the player doesn't float
        }
    }

    shrink() {
        if (this.state === "big") {
            this.state = "small";
            this.attackTimer = 0;
            // Do not change height or y position
        }
    }

    update(keys: Record<string, boolean>) {
        if (this.hurtCooldown > 0) this.hurtCooldown--;
        if (this.powerFlash > 0) this.powerFlash--;
        if (this.attackTimer > 0) this.attackTimer--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        const attackPressed = !!keys['KeyX'];
        if (attackPressed && !this.attackHeld && (this.state === 'big' || this.isInvincible) && this.attackCooldown === 0) {
            this.attackTimer = 12;
            this.attackCooldown = this.profile.cooldown;
            this.attackTargets.clear();
            playSound('stomp', 0.35);
        }
        this.attackHeld = attackPressed;

        if (this.isInvincible) {
            this.invincibilityTimer++;
            if (this.invincibilityTimer > this.invincibilityDurationFrames) {
                this.isInvincible = false;
                this.invincibilityTimer = 0;
            }
        }

        const isRunning = keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyB'];
        const runMultiplier = (isRunning ? 1.6 : 1.0) * (this.isInvincible ? this.invincibilitySpeedMultiplier : 1.0);

        const accel = (this.onGround ? 0.3 : 0.2) * runMultiplier;
        const maxSpeed = this.profile.speed * runMultiplier;
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

        const jumpPressed = !!(keys['Space'] || keys['ArrowUp'] || keys['KeyW']);
        if (this.onGround) {
            this.coyoteFrames = 6;
            this.jumpInProgress = false;
        } else if (this.coyoteFrames > 0) this.coyoteFrames--;
        if (jumpPressed && !this.jumpHeld) this.jumpBufferFrames = 6;
        else if (this.jumpBufferFrames > 0) this.jumpBufferFrames--;
        if (this.jumpBufferFrames > 0 && this.coyoteFrames > 0) {
            this.vy = jumpPressed ? this.profile.jump : -8;
            this.onGround = false;
            this.coyoteFrames = 0;
            this.jumpBufferFrames = 0;
            this.jumpInProgress = true;
            playSound('jump');
        }
        if (!jumpPressed && this.jumpInProgress && this.vy < -6) this.vy = -6;
        this.jumpHeld = jumpPressed;
    }

    drawSprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number) {
        let sprite = image;
        if (this.characterId === 'ginja' && this.attackTimer > 0) {
            const attack = jayAttackImages[Math.min(2, Math.floor((12 - this.attackTimer) / 4))];
            if (attack.complete && attack.naturalWidth > 0) sprite = attack;
        }
        const height = this.h * (this.state === 'big' ? 1.08 : 1);
        const width = Math.min(this.w * 1.65, height * sprite.naturalWidth / sprite.naturalHeight);
        const scale = Math.min(width / sprite.naturalWidth, height / sprite.naturalHeight);
        const drawW = sprite.naturalWidth * scale;
        const drawH = sprite.naturalHeight * scale;
        ctx.save();
        if (this.hurtCooldown > 0 && Math.floor(this.hurtCooldown / 4) % 2 === 0) ctx.globalAlpha *= 0.4;
        if (this.state === 'big') {
            ctx.shadowColor = this.profile.color;
            ctx.shadowBlur = this.powerFlash > 0 ? 20 : 5;
        }
        ctx.translate(x + this.w / 2, y + this.h);
        if (!this.onGround) ctx.rotate(this.vy < 0 ? -0.06 : 0.06);
        ctx.drawImage(sprite, -drawW / 2, -drawH, drawW, drawH);
        ctx.restore();
    }

    drawPowerEffects(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
        const box = this.getAttackBox();
        if (!box) return;
        ctx.save();
        ctx.strokeStyle = this.profile.color;
        ctx.shadowColor = this.profile.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 5;
        ctx.globalAlpha = this.attackTimer / 12;
        const centerX = (this.facingRight ? box.x : box.x + box.w) - camX;
        const angle = this.facingRight ? 0 : Math.PI;
        ctx.beginPath();
        ctx.ellipse(centerX, box.y + box.h / 2 - camY, box.w, box.h / 2,
            0, angle - Math.PI / 2, angle + Math.PI / 2);
        ctx.stroke();
        ctx.restore();
    }

    draw(ctx: CanvasRenderingContext2D, camX: number, camY: number = 0) {
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
        let drawY = this.y - camY;

        // Flip context if facing left
        if (!this.facingRight) {
            ctx.translate(drawX + this.w / 2, drawY);
            ctx.scale(-1, 1);
            drawX = -this.w / 2;
            drawY = 0;
        }

        const isMoving = this.onGround && Math.abs(this.vx) > 0.3;
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
            this.drawSprite(ctx, currentImg, drawX, drawY + bounce);
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = this.state === "big" ? "#F1C40F" : "#E59866";
            ctx.fillRect(drawX, drawY + bounce, this.w, this.h);
        }

        ctx.restore();
    }
}

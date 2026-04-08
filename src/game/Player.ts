import { CONFIG } from './Constants';
import { Entity } from './Types';

export class Player implements Entity {
    isPlayer = true;
    characterId: string = "ginja"; // Default to ginja
    x: number = 100;
    y: number = 480;
    w: number = 32;
    h: number = 48;
    vx: number = 0;
    vy: number = 0;
    onGround: boolean = false;
    state: "small" | "big" = "small";
    facingRight: boolean = true;
    walkDistance: number = 0;

    grow() {
        if (this.state === "small") {
            this.state = "big";
            this.h = 64;
            this.y -= 16;
        }
    }

    shrink() {
        if (this.state === "big") {
            this.state = "small";
            this.h = 48;
            this.y += 16;
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
        let animFrame = 3; // Idle
        if (isMoving) {
            const cycle = Math.floor(this.walkDistance / 12) % 4;
            animFrame = cycle === 3 ? 1 : cycle; // 0, 1, 2, 1 pattern
        }

        let bounce = 0;
        let backLegX = 0;
        let frontLegX = 0;
        let backArmX = 0;
        let frontArmX = 0;
        let frontArmY = 0;

        switch (animFrame) {
            case 0: // Front leg forward, back leg back
                bounce = 0;
                backLegX = -6;
                frontLegX = 6;
                backArmX = -4;
                frontArmX = 4;
                frontArmY = -1;
                break;
            case 1: // Legs crossing
                bounce = -1;
                backLegX = 0;
                frontLegX = 0;
                backArmX = 0;
                frontArmX = 0;
                frontArmY = 0;
                break;
            case 2: // Back leg forward, front leg back
                bounce = 0;
                backLegX = 6;
                frontLegX = -6;
                backArmX = 4;
                frontArmX = -4;
                frontArmY = 1;
                break;
            case 3: // Idle
                bounce = 0;
                backLegX = 0;
                frontLegX = 0;
                backArmX = 0;
                frontArmX = 0;
                frontArmY = 0;
                break;
        }

        // Legs (Pants)
        ctx.fillStyle = "#17202A";
        ctx.fillRect(drawX + 4 + backLegX, drawY + 34, 8, 10); // Back leg
        ctx.fillRect(drawX + 12 + frontLegX, drawY + 34, 8, 10); // Front leg

        // Shoes
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(drawX + 2 + backLegX, drawY + 44, 12, 4); // Back shoe base
        ctx.fillRect(drawX + 10 + frontLegX, drawY + 44, 12, 4); // Front shoe base
        ctx.fillStyle = "#F1C40F";
        ctx.fillRect(drawX + 2 + backLegX, drawY + 42, 10, 2); // Back shoe top
        ctx.fillRect(drawX + 10 + frontLegX, drawY + 42, 10, 2); // Front shoe top

        drawY += bounce;

        // Back Arm
        ctx.fillStyle = "#1C2833";
        ctx.fillRect(drawX + 2 + backArmX, drawY + 20, 8, 12);
        ctx.fillStyle = "#F1C40F";
        ctx.fillRect(drawX + 0 + backArmX, drawY + 22, 10, 2); // Stripe 1
        ctx.fillRect(drawX + 0 + backArmX, drawY + 26, 10, 2); // Stripe 2

        // Body (Jacket)
        ctx.fillStyle = "#1C2833";
        ctx.fillRect(drawX + 6, drawY + 18, 14, 16);
        ctx.fillStyle = "#F1C40F";
        ctx.fillRect(drawX + 6, drawY + 32, 14, 2); // Bottom trim
        
        // GINGA Text
        ctx.fillStyle = "#F1C40F";
        ctx.font = "bold 5px monospace";
        ctx.fillText("GINGA", drawX + 7, drawY + 26);

        // Head (Skin)
        ctx.fillStyle = "#E59866";
        ctx.fillRect(drawX + 8, drawY + 8, 12, 10);

        // Beard (Orange)
        ctx.fillStyle = "#D35400";
        ctx.fillRect(drawX + 6, drawY + 14, 14, 8); // Main beard
        ctx.fillRect(drawX + 18, drawY + 16, 4, 6); // Goatee sticking out

        // Eye & Eyebrow
        ctx.fillStyle = "#A04000";
        ctx.fillRect(drawX + 13, drawY + 8, 4, 2); // Eyebrow
        ctx.fillStyle = "#000000";
        ctx.fillRect(drawX + 14, drawY + 10, 2, 2); // Pupil
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(drawX + 15, drawY + 10, 1, 1); // Glint

        // Hat
        ctx.fillStyle = "#F1C40F";
        ctx.fillRect(drawX + 6, drawY + 2, 14, 6); // Dome
        ctx.fillRect(drawX + 0, drawY + 6, 6, 2); // Backwards brim
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(drawX + 16, drawY + 2, 4, 6); // White strap/back

        // Front Arm (Holding Mic)
        ctx.fillStyle = "#1C2833";
        ctx.fillRect(drawX + 10 + frontArmX, drawY + 20 + frontArmY, 12, 6); // Arm
        ctx.fillStyle = "#F1C40F";
        ctx.fillRect(drawX + 12 + frontArmX, drawY + 20 + frontArmY, 2, 6); // Stripe 1
        ctx.fillRect(drawX + 16 + frontArmX, drawY + 20 + frontArmY, 2, 6); // Stripe 2

        // Hand
        ctx.fillStyle = "#E59866";
        ctx.fillRect(drawX + 22 + frontArmX, drawY + 20 + frontArmY, 4, 4);

        // Mic
        ctx.fillStyle = "#212F3D";
        ctx.fillRect(drawX + 24 + frontArmX, drawY + 18 + frontArmY, 8, 4); // Handle
        ctx.fillStyle = "#566573";
        ctx.fillRect(drawX + 30 + frontArmX, drawY + 16 + frontArmY, 6, 6); // Head

        ctx.restore();
    }
}

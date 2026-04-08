import { Player } from './Player';

export class PassivePlayer extends Player {
    constructor() {
        super();
        this.characterId = "passive";
        this.w = 32;
        this.h = 48;
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

        // Legs (Pants - Black)
        ctx.fillStyle = "#000000";
        ctx.fillRect(drawX + 4 + backLegX, drawY + 34, 8, 10); // Back leg
        ctx.fillRect(drawX + 12 + frontLegX, drawY + 34, 8, 10); // Front leg

        // Shoes (Yellow)
        ctx.fillStyle = "#F1C40F";
        ctx.fillRect(drawX + 2 + backLegX, drawY + 44, 12, 4); // Back shoe base
        ctx.fillRect(drawX + 10 + frontLegX, drawY + 44, 12, 4); // Front shoe base
        ctx.fillStyle = "#FFFFFF"; // White accent
        ctx.fillRect(drawX + 2 + backLegX, drawY + 42, 10, 2); // Back shoe top
        ctx.fillRect(drawX + 10 + frontLegX, drawY + 42, 10, 2); // Front shoe top

        drawY += bounce;

        // Back Arm (White shirt)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(drawX + 2 + backArmX, drawY + 20, 8, 12);

        // Body (White shirt)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(drawX + 6, drawY + 18, 14, 16);
        
        // Head (Skin)
        ctx.fillStyle = "#E59866";
        ctx.fillRect(drawX + 8, drawY + 8, 12, 10);

        // Eye & Eyebrow
        ctx.fillStyle = "#000000";
        ctx.fillRect(drawX + 14, drawY + 10, 2, 2); // Pupil
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(drawX + 15, drawY + 10, 1, 1); // Glint

        // Hat (Black)
        ctx.fillStyle = "#000000";
        ctx.fillRect(drawX + 6, drawY + 2, 14, 6); // Dome
        ctx.fillRect(drawX + 0, drawY + 6, 6, 2); // Backwards brim
        
        // "SUPER" Text on hat
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 4px monospace";
        ctx.fillText("SUPER", drawX + 7, drawY + 6);

        // Front Arm
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(drawX + 10 + frontArmX, drawY + 20 + frontArmY, 12, 6); // Arm

        // Hand
        ctx.fillStyle = "#E59866";
        ctx.fillRect(drawX + 22 + frontArmX, drawY + 20 + frontArmY, 4, 4);

        ctx.restore();
    }
}

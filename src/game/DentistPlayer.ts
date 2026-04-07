import { Player } from './Player';

export class DentistPlayer extends Player {
    constructor() {
        super();
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

        let x = drawX;
        let y = drawY + bounce;

        // Legs
        ctx.fillStyle = "#3E2723"; // Dark skin
        const legOffset = isMoving ? (walkCycle === 0 || walkCycle === 2 ? 4 : 0) : 0;
        ctx.fillRect(x + 12 - legOffset, y + 48, 8, 12); // Back leg
        ctx.fillRect(x + 28 + legOffset, y + 48, 8, 12); // Front leg

        // Shoes
        ctx.fillStyle = "#212121";
        ctx.fillRect(x + 10 - legOffset, y + 60, 12, 4);
        ctx.fillRect(x + 26 + legOffset, y + 60, 12, 4);

        // Shorts
        ctx.fillStyle = "#263238"; // Dark grey shorts
        ctx.fillRect(x + 10, y + 36, 28, 16);
        
        // Belt with "DENTIST"
        ctx.fillStyle = "#000000";
        ctx.fillRect(x + 10, y + 36, 28, 6);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 6px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("DENTIST", x + 24, y + 41);

        // Torso
        ctx.fillStyle = "#3E2723"; // Dark skin
        ctx.fillRect(x + 12, y + 16, 24, 20);

        // Muscles (abs)
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 16, y + 24, 16, 8);

        // Head
        ctx.fillStyle = "#3E2723";
        ctx.fillRect(x + 16, y + 0, 16, 16);

        // Beard
        ctx.fillStyle = "#000000";
        ctx.fillRect(x + 16, y + 10, 16, 6);
        ctx.fillRect(x + 22, y + 16, 4, 2); // Goatee

        // Eyes
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x + 20, y + 4, 2, 2);
        ctx.fillRect(x + 26, y + 4, 2, 2);

        // Gloves (Red)
        ctx.fillStyle = "#D32F2F";
        // Back glove
        const armSwing = isMoving ? Math.sin(this.walkDistance / 24) * 8 : 0;
        ctx.fillRect(x + 4, y + 20 + armSwing, 10, 10);
        // Front glove
        ctx.fillRect(x + 34, y + 20 - armSwing, 10, 10);

        ctx.restore();
    }
}

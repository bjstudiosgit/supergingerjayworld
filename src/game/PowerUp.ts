import { CONFIG } from './Constants';

export class PowerUp {
    x: number;
    y: number;
    vx: number = 1.0;
    vy: number = -4; // Small pop up when spawned
    w: number = 20;
    h: number = 20;
    active: boolean = true;
    onGround: boolean = false;
    characterId: string;

    constructor(x: number, y: number, characterId: string) {
        this.x = x;
        this.y = y;
        this.characterId = characterId;
    }

    update() {
        // Logics like animations would go here
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.active) return;
        const drawX = this.x - camX;
        const drawY = this.y;

        if (this.characterId === 'ginja') {
            // Draw Spoon
            ctx.fillStyle = "#BDC3C7"; // Silver
            // Handle
            ctx.fillRect(drawX + 8, drawY + 8, 4, 12);
            // Bowl
            ctx.beginPath();
            ctx.ellipse(drawX + 10, drawY + 4, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ECF0F1"; // Highlight
            ctx.beginPath();
            ctx.ellipse(drawX + 8, drawY + 2, 2, 4, Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.characterId === 'passive') {
            // Draw Spider
            ctx.fillStyle = "#2C3E50"; // Dark body
            ctx.beginPath();
            ctx.arc(drawX + 10, drawY + 12, 6, 0, Math.PI * 2);
            ctx.fill();
            // Legs
            ctx.strokeStyle = "#2C3E50";
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Left legs
            ctx.moveTo(drawX + 6, drawY + 12); ctx.lineTo(drawX, drawY + 8);
            ctx.moveTo(drawX + 6, drawY + 12); ctx.lineTo(drawX, drawY + 16);
            // Right legs
            ctx.moveTo(drawX + 14, drawY + 12); ctx.lineTo(drawX + 20, drawY + 8);
            ctx.moveTo(drawX + 14, drawY + 12); ctx.lineTo(drawX + 20, drawY + 16);
            ctx.stroke();
            // Eyes
            ctx.fillStyle = "#E74C3C"; // Red eyes
            ctx.fillRect(drawX + 6, drawY + 10, 2, 2);
            ctx.fillRect(drawX + 12, drawY + 10, 2, 2);
        } else if (this.characterId === 'dentist') {
            // Draw Boxing Glove
            ctx.fillStyle = "#E74C3C"; // Red glove
            ctx.beginPath();
            ctx.arc(drawX + 12, drawY + 8, 8, 0, Math.PI * 2); // Main part
            ctx.fill();
            ctx.fillRect(drawX + 4, drawY + 8, 16, 10); // Wrist area
            ctx.fillStyle = "#C0392B"; // Darker red thumb
            ctx.beginPath();
            ctx.arc(drawX + 6, drawY + 10, 4, 0, Math.PI * 2);
            ctx.fill();
            // White wristband
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(drawX + 4, drawY + 16, 16, 4);
        } else {
            // Default Mushroom
            ctx.fillStyle = "#2ecc71"; // green mushroom
            ctx.fillRect(drawX, drawY, this.w, this.h);
            
            // Mushroom spots
            ctx.fillStyle = "white";
            ctx.fillRect(drawX + 4, drawY + 4, 4, 4);
            ctx.fillRect(drawX + 12, drawY + 4, 4, 4);
            ctx.fillRect(drawX + 8, drawY + 12, 4, 4);
        }
    }
}

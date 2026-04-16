import { CONFIG } from './Constants';

const spoonImages = Array.from({ length: 9 }, (_, i) => {
    const img = new Image();
    img.src = `/motion/gingerjay/spoon/spoon${i + 1}.png`;
    return img;
});

const gingaDrinkImages = Array.from({ length: 8 }, (_, i) => {
    const img = new Image();
    img.src = `/motion/gingadrinks/gingadrinks${i + 1}.png`;
    return img;
});

const gloveImages = Array.from({ length: 9 }, (_, i) => {
    const img = new Image();
    img.src = `/motion/glove/glove${i + 1}.png`;
    return img;
});

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
    animationTimer: number = 0;
    isInvincibilityMushroom: boolean = false;

    constructor(x: number, y: number, characterId: string) {
        this.x = x;
        this.y = y;
        this.characterId = characterId;
    }

    update() {
        if (this.active) {
            this.animationTimer++;
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (!this.active) return;
        const drawX = this.x - camX;
        const drawY = this.y;

        if (this.isInvincibilityMushroom) {
            // ⭐ GINGA DRINK ANIMATION (Replaces Invincibility Mushroom)
            const frameIndex = Math.floor(this.animationTimer / 6) % 8;
            const currentImg = gingaDrinkImages[frameIndex];
            
            if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
                ctx.drawImage(currentImg, drawX - 6, drawY - 6, 32, 32);
            } else {
                // Fallback Flashing Box
                const isRed = Math.floor(this.animationTimer / 5) % 2 === 0;
                ctx.fillStyle = isRed ? "#E74C3C" : "#FFFFFF";
                ctx.fillRect(drawX, drawY, this.w, this.h);
            }
            return;
        }

        if (this.characterId === 'ginja') {
            // ⭐ GOLDEN SPOON (Restored)
            const frameIndex = Math.floor(this.animationTimer / 5) % 9;
            const currentImg = spoonImages[frameIndex];
            
            if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
                ctx.drawImage(currentImg, drawX - 6, drawY - 6, 32, 32);
            } else {
                // Fallback Spoon
                ctx.fillStyle = "#F1C40F";
                ctx.fillRect(drawX + 8, drawY + 8, 4, 12);
                ctx.beginPath();
                ctx.ellipse(drawX + 10, drawY + 4, 6, 8, 0, 0, Math.PI * 2);
                ctx.fill();
            }
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
        } else if (this.characterId === 'darren') {
            // ⭐ ANIMATED BOXING GLOVE
            const frameIndex = Math.floor(this.animationTimer / 5) % 9;
            const currentImg = gloveImages[frameIndex];
            
            if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
                ctx.drawImage(currentImg, drawX - 6, drawY - 6, 32, 32);
            } else {
                // Fallback Boxing Glove
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
            }
        } else if (this.characterId === 'roman' || this.characterId === 'passive' || this.characterId === 'grams') {
            // ⭐ YOGHURT POWERUP
            ctx.fillStyle = "#FDFEFE"; // White yoghurt cup
            ctx.beginPath();
            ctx.moveTo(drawX + 4, drawY + 4);
            ctx.lineTo(drawX + 16, drawY + 4);
            ctx.lineTo(drawX + 14, drawY + 20);
            ctx.lineTo(drawX + 6, drawY + 20);
            ctx.closePath();
            ctx.fill();
            // Lid
            ctx.fillStyle = "#3498DB"; // Blue lid
            ctx.fillRect(drawX + 2, drawY + 2, 16, 4);
            // Label
            ctx.fillStyle = "#E74C3C"; // Red label
            ctx.fillRect(drawX + 6, drawY + 10, 8, 4);
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

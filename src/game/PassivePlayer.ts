import { Player } from './Player';

export class PassivePlayer extends Player {
    walkImages: HTMLImageElement[] = [];
    imagesLoaded: boolean = false;

    constructor() {
        super();
        this.characterId = "passive";
        this.w = 32;
        this.h = 48;

        // Load images
        const imagePaths = [
            '/music/characters/passivewalk1.png',
            '/music/characters/passivewalk2.png',
            '/music/characters/passivewalk3.png',
            '/music/characters/passivewalk4.png'
        ];

        let loadedCount = 0;
        for (let i = 0; i < imagePaths.length; i++) {
            const img = new Image();
            img.src = imagePaths[i];
            img.onload = () => {
                loadedCount++;
                if (loadedCount === imagePaths.length) {
                    this.imagesLoaded = true;
                }
            };
            this.walkImages.push(img);
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

        if (this.imagesLoaded) {
            const isMoving = Math.abs(this.vx) > 0.5;
            let animFrame = 0; // Idle (use first frame)
            
            if (isMoving) {
                // Cycle through 0, 1, 2, 3
                animFrame = Math.floor(this.walkDistance / 12) % 4;
            }

            // Draw the image
            // Adjust width/height if the image aspect ratio is different, 
            // but assuming it fits the 32x48 box for now.
            ctx.drawImage(this.walkImages[animFrame], drawX, drawY, this.w, this.h);
        } else {
            // Fallback if images aren't loaded yet
            ctx.fillStyle = "#000000";
            ctx.fillRect(drawX, drawY, this.w, this.h);
        }

        ctx.restore();
    }
}

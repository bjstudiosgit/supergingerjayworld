import { CONFIG } from './Constants';
import { Player } from './players/Player';

export const camera = { 
    x: 0,
    y: 0,
    lookAhead: 0
};

export function updateCamera(player: Player, canvasWidth: number, canvasHeight: number, keys: Record<string, boolean>) {
    const isMobile = window.innerWidth < 768;

    // 🎯 Use facing direction instead of intent for more stable lookahead
    const lookAheadDirection = player.facingRight ? 1 : -1;
    
    // Adjust lookahead based on virtual width
    const baseLookAhead = isMobile ? canvasWidth * 0.15 : 100;
    const targetLookAhead = lookAheadDirection * baseLookAhead;

    // Smoother, persistent lookahead
    camera.lookAhead += (targetLookAhead - camera.lookAhead) * 0.05;

    const screenOffset = isMobile ? canvasWidth * 0.35 : canvasWidth / 2;
    const targetX = player.x - screenOffset + player.w / 2 + camera.lookAhead;

    // 🎥 Horizontal Smooth follow with deadzone
    const diffX = targetX - camera.x;
    const deadzone = 5;
    
    if (Math.abs(diffX) > deadzone) {
        const lerp = isMobile ? 0.1 : 0.08;
        camera.x += diffX * lerp;
    }

    // 🎯 VERTICAL CAMERA (New for Full Bleed Mobile)
    // We want the ground (approx y=600) to be near the bottom 1/3 of the screen or centered
    const groundY = 15 * 40; // TILE=40
    let targetY = 0;
    
    if (isMobile) {
        // Position player in the lower part of the screen (around 70% down)
        // This makes the world feel grounded at the bottom.
        targetY = player.y - canvasHeight * 0.7;
        
        // Clamp: Don't show too much "void" below the ground (y=600 is ground)
        // But also don't go too high.
        targetY = Math.max(0, targetY);
    }
    
    // Smooth vertical follow
    if (!(camera as any).y) (camera as any).y = 0;
    (camera as any).y += (targetY - ((camera as any).y || 0)) * 0.1;

    // 🧱 Clamp Horizontal
    camera.x = Math.max(0, camera.x);
}
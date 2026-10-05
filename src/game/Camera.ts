import { CONFIG } from './Constants';
import { Player } from './players/Player';

export const camera = { 
    x: 0,
    y: 0,
    lookAhead: 0
};

export function getMobileCameraY(player: Player, canvasWidth: number, canvasHeight: number) {
    const verticalAnchor = canvasHeight < canvasWidth ? 0.7 : 0.88;
    return Math.max(0, player.y + player.h - canvasHeight * verticalAnchor);
}

export function updateCamera(player: Player, canvasWidth: number, canvasHeight: number, keys: Record<string, boolean>, isMobile: boolean) {

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
    let targetY = 0;
    
    if (isMobile) {
        // Keep the player's feet above the controls on short landscape screens.
        targetY = getMobileCameraY(player, canvasWidth, canvasHeight);
    }
    
    // Smooth vertical follow
    if (!(camera as any).y) (camera as any).y = 0;
    (camera as any).y += (targetY - ((camera as any).y || 0)) * 0.1;

    // 🧱 Clamp Horizontal
    camera.x = Math.max(0, camera.x);
}

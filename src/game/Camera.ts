import { CONFIG } from './Constants';
import { Player } from './players/Player';

export const camera = { 
    x: 0,
    lookAhead: 0
};

export function updateCamera(player: Player, canvasWidth: number, keys: Record<string, boolean>) {
    const isMobile = window.innerWidth < 768;

    // 🎯 Use facing direction instead of intent for more stable lookahead
    // This removes the "recoil" when stopping.
    const lookAheadDirection = player.facingRight ? 1 : -1;
    
    const baseLookAhead = isMobile ? 180 : 100;
    const targetLookAhead = lookAheadDirection * baseLookAhead;

    // Smoother, persistent lookahead
    camera.lookAhead += (targetLookAhead - camera.lookAhead) * 0.05;

    const screenOffset = isMobile ? canvasWidth * 0.35 : canvasWidth / 2;
    const target = player.x - screenOffset + player.w / 2 + camera.lookAhead;

    // 🎥 Smooth follow with deadzone logic
    const diff = target - camera.x;
    const deadzone = 5;
    
    if (Math.abs(diff) > deadzone) {
        const lerp = isMobile ? 0.1 : 0.08;
        camera.x += diff * lerp;
    }

    // 🧱 Clamp
    camera.x = Math.max(0, camera.x);
}
import { CONFIG } from './Constants';
import { Player } from './players/Player';

export const camera = { 
    x: 0,
    lookAhead: 0
};

export function updateCamera(player: Player, canvasWidth: number, keys: Record<string, boolean>) {
    const isMobile = window.innerWidth < 768;

    // 🎯 Movement intent
    const moveRight = keys['KeyD'] || keys['ArrowRight'];
    const moveLeft = keys['KeyA'] || keys['ArrowLeft'];

    let intent = 0;
    if (moveRight) intent = 1;
    if (moveLeft) intent = -1;

    // 🚀 MUCH stronger mobile lookahead
    const baseLookAhead = isMobile ? 220 : 120;
    const velocityInfluence = isMobile ? 60 : 40;

    const inputLookAhead = intent * baseLookAhead;
    const velocityLookAhead = player.vx * velocityInfluence;

    const targetLookAhead = inputLookAhead * 0.8 + velocityLookAhead * 0.2;

    camera.lookAhead += (targetLookAhead - camera.lookAhead) * 0.15;

    const maxLook = isMobile ? 260 : 150;
    camera.lookAhead = Math.max(-maxLook, Math.min(maxLook, camera.lookAhead));

    // 🎯 SHIFT PLAYER LEFT ON MOBILE (BIG WIN)
    const screenOffset = isMobile ? canvasWidth * 0.35 : canvasWidth / 2;

    const target = player.x - screenOffset + player.w / 2 + camera.lookAhead;

    // ⚡ Cleaner lerp (remove over-complication)
    const baseLerp = isMobile ? 0.12 : CONFIG.cameraLerp;
    const speedBoost = Math.min(Math.abs(player.vx) / 5, 1) * 0.1;

    const lerp = baseLerp + speedBoost;

    // 🎥 Smooth follow
    camera.x += (target - camera.x) * lerp;

    // 🧱 Clamp
    camera.x = Math.max(0, camera.x);
}
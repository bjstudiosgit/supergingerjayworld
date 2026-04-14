import { CONFIG } from './Constants';
import { Player } from './Player';

export const camera = { 
    x: 0,
    lookAhead: 0
};

export function updateCamera(player: Player, canvasWidth: number, keys: Record<string, boolean>) {
    const isMobile = window.innerWidth < 768;

    // 🎯 Intent-based look-ahead
    const moveRight = keys['KeyD'] || keys['ArrowRight'];
    const moveLeft = keys['KeyA'] || keys['ArrowLeft'];
    
    let intent = 0;
    if (moveRight) intent = 1;
    if (moveLeft) intent = -1;

    const targetLookAhead = intent !== 0
        ? intent * 120
        : player.vx * 40;

    camera.lookAhead += (targetLookAhead - camera.lookAhead) * 0.1;
    camera.lookAhead = Math.max(-150, Math.min(150, camera.lookAhead));

    // 🎯 Desired camera position
    const target = player.x - canvasWidth / 2 + player.w / 2 + camera.lookAhead;

    // ⚡ Speed-based lerp
    const speedFactor = Math.min(Math.abs(player.vx) / 5, 1);
    let lerp = CONFIG.cameraLerp + speedFactor * 0.15;

    if (isMobile) lerp *= 1.5;

    // 🎥 Calculate next position
    const nextX = camera.x + (target - camera.x) * lerp;

    // 🎯 Dead zone instead of lock
    const deadZone = 20;
    const diff = nextX - camera.x;

    if (Math.abs(diff) > deadZone) {
        camera.x += diff * 0.2; // fast catch-up
    } else {
        camera.x += diff * 0.05; // slow drift (prevents jitter)
    }

    // 🧱 Clamp
    camera.x = Math.max(0, camera.x);
}
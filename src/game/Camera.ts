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

    // 🎯 TARGET look-ahead based on intent + velocity
    const targetLookAhead = (intent * 100) + (player.vx * 20);
    camera.lookAhead += (targetLookAhead - camera.lookAhead) * 0.05;

    // 🎯 Desired camera position
    const target = player.x - canvasWidth / 2 + player.w / 2 + camera.lookAhead;

    // ⚡ Speed-based lerp
    const speedFactor = Math.min(Math.abs(player.vx) / 5, 1);
    let lerp = CONFIG.cameraLerp + speedFactor * 0.15;

    if (isMobile) lerp *= 1.5;

    // 🎥 Calculate next position
    const nextX = camera.x + (target - camera.x) * lerp;

    // 🚫 PREVENT CAMERA FROM MOVING BACKWARDS UNLESS PLAYER MOVES LEFT
    if (player.vx >= 0) {
        camera.x = Math.max(camera.x, nextX);
    } else {
        camera.x = nextX;
    }

    // 🧱 Clamp
    camera.x = Math.max(0, camera.x);
}
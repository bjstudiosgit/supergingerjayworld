import { CONFIG } from './Constants';
import { Player } from './Player';

export const camera = { x: 0 };

export function updateCamera(player: Player, canvasWidth: number) {
    const target = player.x - 200;
    camera.x += (target - camera.x) * CONFIG.cameraLerp;
    camera.x = Math.max(0, camera.x);
}

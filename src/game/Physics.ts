import { CONFIG } from './Constants';
import { Entity } from './Types';

export function applyPhysics(entity: Entity) {
    entity.vy += CONFIG.gravity;
    entity.x += entity.vx;
    entity.y += entity.vy;
}

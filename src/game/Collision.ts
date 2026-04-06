import { Entity } from './Types';
import { Player } from './Player';
import { Tile } from './Level';
import { Enemy } from './Enemy';
import { Mushroom } from './PowerUp';
import { playSound } from './Sound';

export function rectIntersect(r1: any, r2: any) {
    const r1h = r1.hitbox ? r1.hitbox.h : r1.h;
    const r1w = r1.hitbox ? r1.hitbox.w : r1.w;
    return r1.x < r2.x + r2.w && r1.x + r1w > r2.x && r1.y < r2.y + r2.h && r1.y + r1h > r2.y;
}

export function collideTiles(entity: Entity, tiles: Tile[], onHitBlock?: (t: Tile) => void) {
    entity.onGround = false;
    for (let t of tiles) {
        if (t.destroyed) continue;
        if (rectIntersect(entity, t)) {
            const entityH = entity.hitbox ? entity.hitbox.h : entity.h;
            // Landing on top
            if (entity.vy >= 0 && entity.y + entityH - entity.vy <= t.y + 5) {
                entity.y = t.y - entityH;
                entity.vy = 0;
                entity.onGround = true;
            } 
            // Hitting head
            else if (entity.vy < 0 && entity.y - entity.vy >= t.y + t.h - 5) {
                entity.y = t.y + t.h;
                entity.vy = 0;
                if (entity.isPlayer) {
                    if (t.type === 'brick') {
                        t.destroyed = true;
                        playSound('stomp');
                        if (onHitBlock) onHitBlock(t);
                    } else if (t.type === 'question' && !t.used) {
                        t.used = true;
                        playSound('powerup');
                        if (onHitBlock) onHitBlock(t);
                    }
                }
            }
            // Hitting sides (basic)
            else {
                if (entity.vx > 0) {
                    entity.x = t.x - entity.w;
                    if (!entity.isPlayer) entity.vx *= -1; else entity.vx = 0;
                } else if (entity.vx < 0) {
                    entity.x = t.x + t.w;
                    if (!entity.isPlayer) entity.vx *= -1; else entity.vx = 0;
                }
            }
        }
    }
}

export function collideEnemies(player: Player, enemies: Enemy[], resetCallback: () => void) {
    for (let e of enemies) {
        if (e.alive && rectIntersect(player, e)) {
            const playerH = player.hitbox ? player.hitbox.h : player.h;
            if (player.vy > 0 && player.y + playerH - player.vy <= e.y + 10) {
                e.alive = false;
                player.vy = -10; // Stomp bounce
                playSound('stomp');
            } else {
                if (player.state === "big") {
                    player.shrink();
                    e.alive = false; // Optional: kill enemy on hit? Or just push back?
                    playSound('hit');
                } else {
                    playSound('hit');
                    console.log("Oi what you doing bruv!");
                    resetCallback();
                }
            }
        }
    }
}

export function collidePowerUps(player: Player, mushrooms: Mushroom[]) {
    for (let m of mushrooms) {
        if (m.active && rectIntersect(player, m)) {
            m.active = false;
            player.grow();
            playSound('powerup');
        }
    }
}

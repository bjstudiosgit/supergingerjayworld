import { Entity, EnemyEntity } from './Types';
import { Player } from './Player';
import { Tile } from './Level';
import { Mushroom } from './PowerUp';
import { playSound } from './Sound';

export function rectIntersect(r1: any, r2: any) {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}

export function collideTiles(entity: Entity, tiles: Tile[], onHitBlock?: (t: Tile) => void) {
    entity.onGround = false;
    for (let t of tiles) {
        if (t.destroyed || t.type === 'flagpole' || t.type === 'coin' || t.type === 'castle') continue;
        if (rectIntersect(entity, t)) {
            // Landing on top
            if (entity.vy >= 0 && entity.y + entity.h - entity.vy <= t.y + 5) {
                entity.y = t.y - entity.h;
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
                        if (t.hits !== undefined && t.hits > 1) {
                            t.hits--;
                        } else {
                            t.used = true;
                        }
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

export function collideEnemies(player: Player, enemies: EnemyEntity[], resetCallback: () => void, onEnemyDefeated: () => void) {
    for (let e of enemies) {
        if (e.alive && rectIntersect(player, e) && !(e.hp !== undefined && e.hp <= 0 && (e as any).isBoss)) {
            if (player.vy > 0 && player.y + player.h - player.vy <= e.y + 10) {
                if (e.hp !== undefined) {
                    e.hp--;
                    if ((e as any).isBoss && e.hp > 0) {
                        new Audio('/soundeffects/ackhiiii.mp3').play().catch(() => {});
                    }
                    if (e.hp <= 0) {
                        if (!(e as any).isBoss) {
                            e.alive = false;
                            onEnemyDefeated();
                        }
                    }
                } else {
                    if ((e as any).name === "COOKIE") {
                        new Audio('/soundeffects/scream.mp3').play().catch(() => {});
                    }
                    e.alive = false;
                    onEnemyDefeated();
                }
                player.vy = -10; // Stomp bounce
                playSound('stomp');
            } else {
                if (player.state === "big") {
                    player.shrink();
                    e.alive = false; // Optional: kill enemy on hit? Or just push back?
                    playSound('hit');
                    if (player.characterId === "ginja") {
                        new Audio('/soundeffects/gingerjesus.mp3').play().catch(() => {});
                    }
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

import { Entity, EnemyEntity } from './Types';
import { Player } from './Player';
import { Tile } from './Level';
import { PowerUp } from './PowerUp';
import { playSound } from './Sound';
import { triggerDeath } from './Enemy';

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

export function collideEnemies(
    player: Player,
    enemies: EnemyEntity[],
    resetCallback: () => void,
    onEnemyDefeated: () => void
) {
    for (let e of enemies) {
        if (
            !e.alive ||
            e.isDying ||
            !rectIntersect(player, e) ||
            (e.hp !== undefined && e.hp <= 0 && (e as any).isBoss)
        ) continue;

        const isBoss = (e as any).isBoss;
        const isBouncer = (e as any).name === "BOUNCER";

        // ⭐ INVINCIBLE PLAYER
        if (player.isInvincible) {
            if (e.hp !== undefined) e.hp = 0;

            if ((e as any).name === "COOKIE") {
                new Audio('/soundeffects/scream.mp3').play().catch(() => {});
            }

            triggerDeath(e as any);

            onEnemyDefeated();
            playSound('hit');
            continue;
        }

        // ⭐ STOMP
        if (player.vy > 0 && player.y + player.h - player.vy <= e.y + 10) {

            if (e.hp !== undefined) {
                // 🔊 PLAY HIT SOUND FOR BOSSES / BOUNCER
                if ((isBoss || isBouncer) && e.hp > 1) {
                    console.log(`Bouncer hit! HP: ${e.hp}, playing ackhiiii.mp3`);
                    new Audio('/soundeffects/ackhiiii.mp3').play().catch(err => console.error("Error playing ackhiiii.mp3:", err));
                }

                e.hp--;

                // 💀 DEATH
                if (e.hp <= 0) {
                    triggerDeath(e as any);
                    onEnemyDefeated();
                }

            } else {
                // NON-HP ENEMIES
                if ((e as any).name === "COOKIE") {
                    new Audio('/soundeffects/scream.mp3').play().catch(() => {});
                }

                triggerDeath(e as any);
                onEnemyDefeated();
            }

            player.vy = -10;
            playSound('stomp');
            continue;
        }

        // ⭐ SIDE HIT
        if (player.state === "big") {
            player.shrink();
            e.alive = false;
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

export function collidePowerUps(player: Player, powerups: PowerUp[]) {
    for (let m of powerups) {
        if (m.active && rectIntersect(player, m)) {
            m.active = false;
            if (m.isInvincibilityMushroom) {
                player.isInvincible = true;
                player.invincibilityTimer = 0;
                playSound('powerup');
            } else {
                player.grow();
                playSound('powerup');
            }
        }
    }
}

import { Entity, EnemyEntity } from './Types';
import { Player } from './players/Player';
import { Tile } from './Level';
import { PowerUp } from './PowerUp';
import { playInvincibilityTune, playSound } from './Sound';
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
    onEnemyDefeated: () => void,
    tiles: Tile[] = []
) {
    const attackBox = player.getAttackBox();
    if (attackBox) {
        for (const tile of tiles) {
            if (tile.destroyed || ['coin', 'flagpole', 'castle'].includes(tile.type)
                || !rectIntersect(attackBox, tile)) continue;
            if (player.facingRight) attackBox.w = Math.max(0, tile.x - attackBox.x);
            else {
                const right = attackBox.x + attackBox.w;
                attackBox.x = Math.min(right, tile.x + tile.w);
                attackBox.w = right - attackBox.x;
            }
        }
    }
    for (let e of enemies) {
        if (!e.alive || e.isDying || ((e as any).isBoss && (e.hp ?? 0) <= 0)) continue;
        if (attackBox && attackBox.w > 0 && rectIntersect(attackBox, e)) {
            if (!player.attackTargets.has(e)) {
                player.attackTargets.add(e);
                const target = e as EnemyEntity & { takeHit?: () => boolean };
                if (target.takeHit) {
                    if (target.takeHit()) {
                        playSound('stomp');
                        if ((e.hp ?? 0) <= 0) onEnemyDefeated();
                    }
                } else {
                    triggerDeath(e as any);
                    onEnemyDefeated();
                    playSound('stomp');
                }
            }
            continue;
        }
        if (
            player.hurtCooldown > 0 ||
            !e.alive ||
            e.isDying ||
            !rectIntersect(player, e) ||
            (e.hp !== undefined && e.hp <= 0 && (e as any).isBoss)
        ) continue;

        const isBoss = (e as any).isBoss;
        const isBouncer = (e as any).name === "BOUNCER";
        const boss = e as EnemyEntity & {
            isBoss?: boolean;
            name?: string;
            takeHit?: () => boolean;
        };

        // ⭐ INVINCIBLE PLAYER
        if (player.isInvincible) {
            if (isBoss || isBouncer) {
                const damageApplied = boss.takeHit ? boss.takeHit() : true;
                if (!boss.takeHit && e.hp !== undefined) e.hp--;

                if (damageApplied) {
                    playSound(e.hp !== undefined && e.hp <= 0 ? 'stomp' : 'ackhiiii');
                    if (e.hp !== undefined && e.hp <= 0) onEnemyDefeated();
                }

                player.vx = player.x < e.x ? -7 : 7;
                player.vy = -8;
                continue;
            }

            if (e.hp !== undefined) e.hp = 0;

            const enemyName = (e as any).name;
            if (enemyName === "COOKIE") {
                playSound('scream');
            } else if (enemyName === "MARGS") {
                playSound('fgingerjay');
            }

            triggerDeath(e as any);

            onEnemyDefeated();
            playSound('hit');
            continue;
        }

        // ⭐ STOMP
        const stompTolerance = isBouncer ? 32 : isBoss ? 25 : 10;
        const previousPlayerBottom = player.y + player.h - player.vy;
        const previousEnemyTop = e.y - e.vy;
        const isDescendingOntoEnemy = player.vy - e.vy > 0;
        if (isDescendingOntoEnemy && previousPlayerBottom <= previousEnemyTop + stompTolerance) {

            if (e.hp !== undefined) {
                const damageApplied = boss.takeHit ? boss.takeHit() : true;
                if (!boss.takeHit) e.hp--;

                // 💀 DEATH
                if (damageApplied && e.hp <= 0) {
                    if ((e as any).name === "MARGS") {
                        playSound('fgingerjay');
                    }
                    
                    // Bouncer handles his own defeat logic, others use triggerDeath
                    if ((e as any).name !== "BOUNCER") {
                        triggerDeath(e as any);
                    }
                    
                    onEnemyDefeated();
                } else if (damageApplied && (isBoss || isBouncer)) {
                    playSound('ackhiiii');
                }

            } else {
                // NON-HP ENEMIES
                const enemyName = (e as any).name;
                if (enemyName === "COOKIE") {
                    playSound('scream');
                } else if (enemyName === "MARGS") {
                    playSound('fgingerjay');
                }

                triggerDeath(e as any);
                onEnemyDefeated();
            }

            // Snap clear of the hitbox before bouncing so the next frame cannot
            // misclassify a successful stomp as a lethal side collision.
            player.y = e.y - player.h;
            player.vy = -10;
            player.onGround = false;
            playSound('stomp');
            continue;
        }

        // ⭐ SIDE HIT
        if (isBoss || isBouncer) {
            if (player.state === "big") {
                player.shrink();
                player.hurtCooldown = 90;
                player.vx = player.x < e.x ? -7 : 7;
                player.vy = -8;
                e.vx *= -1;
                playSound('hit');
            } else {
                playSound('hit');
                resetCallback();
            }
            return;
        }

        if (player.state === "big") {
            player.shrink();
            player.hurtCooldown = 90;
            triggerDeath(e as any);
            onEnemyDefeated();
            playSound('hit');

            if (player.characterId === "ginja") {
                playSound('gingerjesus');
            } else if (player.characterId === "ryno") {
                playSound('ryno_itstime');
            } else if (player.characterId === "tymeless") {
                playSound('tymeless_letsgoo');
            }
            return;
        } else {
            playSound('hit');
            console.log("Oi what you doing bruv!");
            resetCallback();
            return;
        }
    }
}

export function collidePowerUps(player: Player, powerups: PowerUp[], onInvincibilityStart?: () => void, addLife?: () => void) {
    for (let m of powerups) {
        if (m.active && rectIntersect(player, m)) {
            m.active = false;
            if (m.isInvincibilityMushroom) {
                player.isInvincible = true;
                player.invincibilityTimer = 0;
                playSound('powerup');
                playInvincibilityTune();
                if (onInvincibilityStart) onInvincibilityStart();
            } else if (m.isHeart) {
                if (addLife) addLife();
                playSound('powerup'); // Or a special life sound
            } else {
                player.grow();
                playSound('powerup');
            }
        }
    }
}

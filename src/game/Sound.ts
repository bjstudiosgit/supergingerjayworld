// Simple synthesized sounds so we don't need external assets
let audioCtx: AudioContext | null = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
}

export type SoundType = 'jump' | 'stomp' | 'hit' | 'powerup' | 'coin' | 'firework' | 'extralife' | 'gingerjesus' | 'nightmare' | 'ackhiiii' | 'scream' | 'ohgosh' | 'pushin' | 'fgingerjay' | 'ryno_itstime' | 'tymeless_letsgoo';

const SOUND_FILES: Record<string, string> = {
    extralife: '/soundeffects/extralife.mp3',
    gingerjesus: '/soundeffects/gingerjesus.mp3',
    nightmare: '/soundeffects/nightmare.mp3',
    ackhiiii: '/soundeffects/ackhiiii.mp3',
    scream: '/soundeffects/scream.mp3',
    ohgosh: '/soundeffects/ohgosh.mp3',
    pushin: '/soundeffects/pushin.mp3',
    fgingerjay: '/soundeffects/fgingerjay.mp3',
    ryno_itstime: '/soundeffects/ryno_itstime.mp3',
    tymeless_letsgoo: '/soundeffects/tymeless_letsgoo.mp3'
};

const soundBuffers: Record<string, AudioBuffer> = {};

async function loadSoundBuffer(type: string, ctx: AudioContext) {
    if (soundBuffers[type]) return soundBuffers[type];
    const url = SOUND_FILES[type];
    if (!url) return null;

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        soundBuffers[type] = audioBuffer;
        return audioBuffer;
    } catch (e) {
        console.error(`Failed to load sound: ${type}`, e);
        return null;
    }
}

export async function playSound(type: SoundType, volume: number = 1.0) {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') await ctx.resume();
        
        const now = ctx.currentTime;

        // Handle file-based sounds
        if (SOUND_FILES[type]) {
            const buffer = await loadSoundBuffer(type, ctx);
            if (buffer) {
                const source = ctx.createBufferSource();
                const gain = ctx.createGain();
                source.buffer = buffer;
                gain.gain.setValueAtTime(volume, now);
                source.connect(gain);
                gain.connect(ctx.destination);
                source.start(now);
            }
            return;
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'jump') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            gain.gain.setValueAtTime(0.1 * volume, now);
            gain.gain.exponentialRampToValueAtTime(0.01 * volume, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'stomp') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
            gain.gain.setValueAtTime(0.1 * volume, now);
            gain.gain.exponentialRampToValueAtTime(0.01 * volume, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
            gain.gain.setValueAtTime(0.2 * volume, now);
            gain.gain.exponentialRampToValueAtTime(0.01 * volume, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'powerup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(500, now + 0.1);
            osc.frequency.linearRampToValueAtTime(700, now + 0.2);
            gain.gain.setValueAtTime(0.1 * volume, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'coin') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(987.77, now); // B5
            osc.frequency.setValueAtTime(1318.51, now + 0.1); // E6
            gain.gain.setValueAtTime(0.1 * volume, now);
            gain.gain.exponentialRampToValueAtTime(0.01 * volume, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'firework') {
            // White noise burst for explosion
            const bufferSize = ctx.sampleRate * 0.3; // 0.3 seconds
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            // Filter the noise to sound more like an explosion
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.3 * volume, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01 * volume, now + 0.3);
            
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            
            noise.start(now);
            noise.stop(now + 0.3);
        }
    } catch (e) {
        console.warn("Audio not supported or failed to play", e);
    }
}

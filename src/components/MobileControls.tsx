import React from 'react';

interface MobileControlsProps {
    onControl: (code: string, isDown: boolean) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onControl }) => {
    // Premium transparent button style
    const btnBase = "flex items-center justify-center select-none touch-none transition-transform active:scale-90 active:opacity-70 bg-white/20 backdrop-blur-md border-[3px] border-white/30 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]";
    const dpadBtn = `${btnBase} w-[50px] h-[50px] text-white text-xl font-black`;
    const actionBtn = `${btnBase} w-[60px] h-[60px] text-white text-2xl font-black italic`;

    const handleControlStart = (code: string, e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onControl(code, true);
    };

    const handleControlEnd = (code: string, e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        onControl(code, false);
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-50 select-none font-mono">
            {/* Left Side: D-Pad */}
            <div
                className="absolute pointer-events-auto flex flex-col items-center gap-1"
                style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))', left: 'calc(1rem + env(safe-area-inset-left))' }}
            >
                <button 
                    aria-label="Jump"
                    className={dpadBtn} 
                    onPointerDown={(e) => handleControlStart('ArrowUp', e)} 
                    onPointerUp={(e) => handleControlEnd('ArrowUp', e)}
                    onPointerCancel={(e) => handleControlEnd('ArrowUp', e)}
                >
                    ↑
                </button>
                <div className="flex gap-6">
                    <button 
                        aria-label="Move left"
                        className={dpadBtn} 
                        onPointerDown={(e) => handleControlStart('ArrowLeft', e)} 
                        onPointerUp={(e) => handleControlEnd('ArrowLeft', e)}
                        onPointerCancel={(e) => handleControlEnd('ArrowLeft', e)}
                    >
                        ←
                    </button>
                    <button 
                        aria-label="Move right"
                        className={dpadBtn} 
                        onPointerDown={(e) => handleControlStart('ArrowRight', e)} 
                        onPointerUp={(e) => handleControlEnd('ArrowRight', e)}
                        onPointerCancel={(e) => handleControlEnd('ArrowRight', e)}
                    >
                        →
                    </button>
                </div>
                <button 
                    aria-label="Enter pipe"
                    className={dpadBtn} 
                    onPointerDown={(e) => handleControlStart('ArrowDown', e)} 
                    onPointerUp={(e) => handleControlEnd('ArrowDown', e)}
                    onPointerCancel={(e) => handleControlEnd('ArrowDown', e)}
                >
                    ↓
                </button>
            </div>

            {/* Right Side: Action Buttons */}
            <div
                className="absolute pointer-events-auto flex items-end gap-3 pb-2"
                style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))', right: 'calc(1rem + env(safe-area-inset-right))' }}
            >
                <div className="flex flex-col items-center gap-6">
                   <div className="relative">
                        <button
                            aria-label="Power attack"
                            className={`${actionBtn} bg-cyan-500/40 border-cyan-300/60`}
                            onPointerDown={(e) => handleControlStart('KeyX', e)}
                            onPointerUp={(e) => handleControlEnd('KeyX', e)}
                            onPointerCancel={(e) => handleControlEnd('KeyX', e)}
                        >X</button>
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-white/80 text-[8px] font-bold uppercase tracking-widest">Power</span>
                   </div>
                   <div className="relative">
                        <button 
                            aria-label="Run"
                            className={`${actionBtn} bg-red-500/40 border-red-400/50`}
                            onPointerDown={(e) => handleControlStart('KeyB', e)} 
                            onPointerUp={(e) => handleControlEnd('KeyB', e)}
                            onPointerCancel={(e) => handleControlEnd('KeyB', e)}
                        >
                            B
                        </button>
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-white/50 text-[8px] font-bold uppercase tracking-widest">Run</span>
                   </div>
                </div>
                <div className="flex flex-col items-center gap-6 translate-y-[-20px]">
                    <div className="relative">
                        <button 
                            aria-label="Jump action"
                            className={`${actionBtn} bg-yellow-500/40 border-yellow-400/50 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]`}
                            onPointerDown={(e) => handleControlStart('Space', e)} 
                            onPointerUp={(e) => handleControlEnd('Space', e)}
                            onPointerCancel={(e) => handleControlEnd('Space', e)}
                        >
                            A
                        </button>
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-white/50 text-[8px] font-bold uppercase tracking-widest">Jump</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

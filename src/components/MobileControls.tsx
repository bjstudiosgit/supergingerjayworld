import React from 'react';

interface MobileControlsProps {
    onControl: (code: string, isDown: boolean) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onControl }) => {
    // Premium transparent button style
    const btnBase = "flex items-center justify-center select-none touch-none transition-transform active:scale-90 active:opacity-70 bg-white/20 backdrop-blur-md border-[3px] border-white/30 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]";
    const dpadBtn = `${btnBase} w-[50px] h-[50px] text-white text-xl font-black`;
    const actionBtn = `${btnBase} w-[60px] h-[60px] text-white text-2xl font-black italic`;

    const handleTouchStart = (code: string, e: React.TouchEvent) => {
        e.preventDefault();
        onControl(code, true);
    };

    const handleTouchEnd = (code: string, e: React.TouchEvent) => {
        e.preventDefault();
        onControl(code, false);
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-50 select-none md:hidden font-mono">
            {/* Left Side: D-Pad */}
            <div className="absolute bottom-4 left-4 pointer-events-auto flex flex-col items-center gap-1">
                <button 
                    className={dpadBtn} 
                    onTouchStart={(e) => handleTouchStart('ArrowUp', e)} 
                    onTouchEnd={(e) => handleTouchEnd('ArrowUp', e)}
                >
                    ↑
                </button>
                <div className="flex gap-6">
                    <button 
                        className={dpadBtn} 
                        onTouchStart={(e) => handleTouchStart('ArrowLeft', e)} 
                        onTouchEnd={(e) => handleTouchEnd('ArrowLeft', e)}
                    >
                        ←
                    </button>
                    <button 
                        className={dpadBtn} 
                        onTouchStart={(e) => handleTouchStart('ArrowRight', e)} 
                        onTouchEnd={(e) => handleTouchEnd('ArrowRight', e)}
                    >
                        →
                    </button>
                </div>
                <button 
                    className={dpadBtn} 
                    onTouchStart={(e) => handleTouchStart('ArrowDown', e)} 
                    onTouchEnd={(e) => handleTouchEnd('ArrowDown', e)}
                >
                    ↓
                </button>
            </div>

            {/* Right Side: Action Buttons */}
            <div className="absolute bottom-6 right-4 pointer-events-auto flex items-end gap-3 pb-2">
                <div className="flex flex-col items-center gap-6">
                   <div className="relative">
                        <button 
                            className={`${actionBtn} bg-red-500/40 border-red-400/50`}
                            onTouchStart={(e) => handleTouchStart('KeyB', e)} 
                            onTouchEnd={(e) => handleTouchEnd('KeyB', e)}
                        >
                            B
                        </button>
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-white/50 text-[8px] font-bold uppercase tracking-widest">Run</span>
                   </div>
                </div>
                <div className="flex flex-col items-center gap-6 translate-y-[-20px]">
                    <div className="relative">
                        <button 
                            className={`${actionBtn} bg-yellow-500/40 border-yellow-400/50 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]`}
                            onTouchStart={(e) => handleTouchStart('Space', e)} 
                            onTouchEnd={(e) => handleTouchEnd('Space', e)}
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

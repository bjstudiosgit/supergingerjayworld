import React from 'react';

interface MobileControlsProps {
    onControl: (code: string, isDown: boolean) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onControl }) => {
    const buttonClass = "w-16 h-16 rounded-full bg-gray-700 border-4 border-gray-900 flex items-center justify-center text-white font-bold text-xl active:bg-gray-600 select-none";
    const dpadClass = "w-16 h-16 rounded-lg bg-gray-700 border-4 border-gray-900 flex items-center justify-center text-white font-bold text-xl active:bg-gray-600 select-none";

    return (
        <div className="fixed bottom-4 left-4 right-4 flex justify-between items-end z-50 md:hidden">
            {/* D-Pad */}
            <div className="grid grid-cols-3 gap-1">
                <div />
                <button className={dpadClass} onTouchStart={() => onControl('ArrowUp', true)} onTouchEnd={() => onControl('ArrowUp', false)}>↑</button>
                <div />
                <button className={dpadClass} onTouchStart={() => onControl('ArrowLeft', true)} onTouchEnd={() => onControl('ArrowLeft', false)}>←</button>
                <div />
                <button className={dpadClass} onTouchStart={() => onControl('ArrowRight', true)} onTouchEnd={() => onControl('ArrowRight', false)}>→</button>
                <div />
                <button className={dpadClass} onTouchStart={() => onControl('ArrowDown', true)} onTouchEnd={() => onControl('ArrowDown', false)}>↓</button>
                <div />
            </div>

            {/* A/B Buttons */}
            <div className="flex gap-4">
                <button className={`${buttonClass} bg-red-600 active:bg-red-500`} onTouchStart={() => onControl('KeyB', true)} onTouchEnd={() => onControl('KeyB', false)}>B</button>
                <button className={`${buttonClass} bg-red-600 active:bg-red-500`} onTouchStart={() => onControl('Space', true)} onTouchEnd={() => onControl('Space', false)}>A</button>
            </div>
        </div>
    );
};

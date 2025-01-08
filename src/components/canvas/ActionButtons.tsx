import React from 'react';

interface ActionButtonsProps {
    historyIndex: number;
    historyLength: number;
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    historyIndex,
    historyLength,
    onUndo,
    onRedo,
    onSave
}) => {
    return (
        <div className="mt-4 space-x-2">
            <button
                className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
                onClick={onUndo}
                disabled={historyIndex < 0}
            >
                실행취소
            </button>
            <button
                className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
                onClick={onRedo}
                disabled={historyIndex >= historyLength - 1}
            >
                재실행
            </button>
            <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={onSave}
            >
                저장
            </button>
        </div>
    );
};
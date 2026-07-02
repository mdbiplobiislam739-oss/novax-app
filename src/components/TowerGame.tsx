import React, { useState } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { store } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export default function TowerGame({ betAmount, onError }: { betAmount: string; onError: (msg: string) => void }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    
    // Tower is typically 8 or 9 rows high, 5 items wide (e.g. 1 mine per row)
    const ROWS = 8;
    const COLS = 5;

    const [status, setStatus] = useState<'idle' | 'playing' | 'cashed_out' | 'exploded'>('idle');
    const [currentRow, setCurrentRow] = useState(0); // starts from 0 (bottom)
    const [grid, setGrid] = useState<number[]>([]); // which column has the bomb for each row
    const [selections, setSelections] = useState<number[]>([]); // which column user selected for each row
    const [multiplier, setMultiplier] = useState(1.0);

    const multipliers = [1.2, 1.5, 2.0, 3.0, 4.5, 7.0, 10.0, 15.0];

    const handleBet = () => {
        if (!user) {
            onError(t('Please login first'));
            return;
        }
        const amt = parseFloat(betAmount);
        if (isNaN(amt) || amt <= 0 || user.balance < amt) {
            onError(t('Invalid bet amount or insufficient balance'));
            return;
        }

        store.addTransaction({
            userId: user.id,
            type: 'withdraw',
            amount: amt,
            status: 'completed',
            description: `Tower Bet`
        });
        store.updateUser(user.id, { balance: user.balance - amt });
        
        // Generate grid (one bomb per row)
        const newGrid = Array(ROWS).fill(0).map(() => Math.floor(Math.random() * COLS));
        
        setGrid(newGrid);
        setSelections([]);
        setMultiplier(1.0);
        setCurrentRow(0);
        setStatus('playing');
        onError('');
    };

    const handleCellClick = (rowIndex: number, colIndex: number) => {
        if (status !== 'playing' || rowIndex !== currentRow) return;
        
        const isBomb = grid[rowIndex] === colIndex;
        const newSelections = [...selections];
        newSelections[rowIndex] = colIndex;
        setSelections(newSelections);

        if (isBomb) {
            setStatus('exploded');
        } else {
            const nextMult = multipliers[rowIndex];
            setMultiplier(nextMult);
            if (rowIndex === ROWS - 1) {
                // Reached top
                handleCashout(nextMult);
            } else {
                setCurrentRow(rowIndex + 1);
            }
        }
    };

    const handleCashout = (finalMulti = multiplier) => {
        if (status !== 'playing') return;
        const amt = parseFloat(betAmount);
        const winAmount = amt * finalMulti;
        
        store.addTransaction({
            userId: user!.id,
            type: 'deposit',
            amount: winAmount,
            status: 'completed',
            description: `Tower Win (${finalMulti}x)`
        });
        store.updateUser(user!.id, { balance: user!.balance + winAmount });
        setStatus('cashed_out');
    };

    return (
        <div className="bg-[#050b1a] rounded-3xl p-6 mb-6 flex flex-col md:flex-row gap-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#1e293b]">
            {/* Controls */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                <h2 className="text-2xl font-black text-amber-500 mb-2 uppercase drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] flex items-center gap-2">
                    🗼 {t('Tower')}
                </h2>
                <p className="text-text-muted text-sm mb-4">Climb the tower to increase your multiplier. Watch out for falling skulls!</p>
                
                {status === 'playing' ? (
                    <button
                        onClick={() => handleCashout(multiplier)}
                        disabled={currentRow === 0} // Must clear at least 1 row to cashout
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] text-lg disabled:opacity-50"
                    >
                        Cashout {(parseFloat(betAmount) * multiplier).toFixed(2)} XRP
                    </button>
                ) : (
                    <button
                        onClick={handleBet}
                        className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] text-lg uppercase"
                    >
                        Bet
                    </button>
                )}

                {status === 'exploded' && <div className="text-red-500 font-bold text-center">You fell off the tower!</div>}
                {status === 'cashed_out' && <div className="text-green-500 font-bold text-center">Cashed out at {multiplier}x!</div>}
            </div>

            {/* Grid */}
            <div className="w-full md:w-2/3 flex items-center justify-center">
                <div className="flex flex-col gap-2 bg-[#0f172a] p-4 rounded-2xl border border-[#334155] w-full max-w-[400px]">
                    {Array.from({length: ROWS}).map((_, invertedRow) => {
                        const row = ROWS - 1 - invertedRow; // render top to bottom
                        const isCurrentRow = row === currentRow && status === 'playing';
                        const isPastRow = row < currentRow || status === 'exploded' || status === 'cashed_out';
                        const mult = multipliers[row];
                        
                        return (
                            <div key={row} className={`flex items-center gap-2 ${!isCurrentRow && !isPastRow ? 'opacity-50' : ''}`}>
                                <div className="w-12 text-xs font-bold text-amber-500 text-right">{mult}x</div>
                                <div className="flex-1 grid grid-cols-5 gap-2">
                                    {Array.from({length: COLS}).map((_, col) => {
                                        const isRevealed = (isPastRow || status === 'cashed_out') && selections[row] === col;
                                        const showBomb = (status === 'exploded' || status === 'cashed_out') && grid[row] === col;
                                        
                                        let content = '';
                                        let bgClass = 'bg-[#1e293b] hover:bg-[#334155]';
                                        
                                        if (isRevealed) {
                                            if (grid[row] === col) {
                                                content = '💀';
                                                bgClass = 'bg-red-500/20 border border-red-500/50';
                                            } else {
                                                content = '⭐';
                                                bgClass = 'bg-emerald-500/20 border border-emerald-500/50';
                                            }
                                        } else if (showBomb) {
                                            content = '💀';
                                            bgClass = 'bg-red-500/10 border border-red-500/30 opacity-50';
                                        }

                                        return (
                                            <button
                                                key={col}
                                                onClick={() => handleCellClick(row, col)}
                                                disabled={!isCurrentRow}
                                                className={`aspect-[4/3] rounded-lg flex items-center justify-center text-xl transition-all ${bgClass} ${isCurrentRow ? 'shadow-[0_0_10px_rgba(245,158,11,0.2)] border border-amber-500/30' : 'border border-transparent'}`}
                                            >
                                                {content}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

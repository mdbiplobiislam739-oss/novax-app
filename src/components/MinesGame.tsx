import React, { useState } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { store } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Coins } from 'lucide-react';
import { motion } from 'motion/react';

export default function MinesGame({ betAmount, onError }: { betAmount: string; onError: (msg: string) => void }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    
    const [status, setStatus] = useState<'idle' | 'playing' | 'cashed_out' | 'exploded'>('idle');
    const [minesCount, setMinesCount] = useState(3);
    const [clicked, setClicked] = useState<number[]>([]);
    const [grid, setGrid] = useState<('diamond' | 'bomb')[]>([]);
    const [multiplier, setMultiplier] = useState(1);
    
    // Multiplier calculation (simplified)
    const getNextMultiplier = (currentClicked: number) => {
        const remainingSafe = 25 - minesCount - currentClicked;
        if (remainingSafe <= 0) return multiplier;
        // Simple scaling
        return parseFloat((multiplier * (1 + (minesCount / (25 - currentClicked)))).toFixed(2));
    };

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

        // Deduct balance
        store.addTransaction({
            userId: user.id,
            type: 'withdraw',
            amount: amt,
            status: 'completed',
            description: `Mines Bet`
        });
        store.updateUser(user.id, { balance: user.balance - amt });
        
        // Generate grid
        const newGrid = Array(25).fill('diamond');
        let placedMines = 0;
        while (placedMines < minesCount) {
            const idx = Math.floor(Math.random() * 25);
            if (newGrid[idx] !== 'bomb') {
                newGrid[idx] = 'bomb';
                placedMines++;
            }
        }
        
        setGrid(newGrid);
        setClicked([]);
        setMultiplier(1.0);
        setStatus('playing');
        onError('');
    };

    const handleCellClick = (index: number) => {
        if (status !== 'playing' || clicked.includes(index)) return;
        
        const newClicked = [...clicked, index];
        setClicked(newClicked);
        
        if (grid[index] === 'bomb') {
            setStatus('exploded');
        } else {
            setMultiplier(getNextMultiplier(clicked.length));
            // Check if won (all diamonds found)
            if (newClicked.length === 25 - minesCount) {
                handleCashout(getNextMultiplier(clicked.length));
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
            description: `Mines Win (${finalMulti}x)`
        });
        store.updateUser(user!.id, { balance: user!.balance + winAmount });
        setStatus('cashed_out');
    };
    
    return (
        <div className="bg-[#050b1a] rounded-3xl p-6 mb-6 flex flex-col md:flex-row gap-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#1e293b]">
            
            {/* Controls */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                <h2 className="text-2xl font-black text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] flex items-center gap-2">
                    💣 {t('Mines')}
                </h2>
                
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Mines Amount</label>
                    <select 
                        value={minesCount} 
                        onChange={(e) => setMinesCount(Number(e.target.value))}
                        disabled={status === 'playing'}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded-xl p-3 text-white focus:outline-none focus:border-brand-primary"
                    >
                        {[1,2,3,4,5,10,15,20].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                
                {status === 'playing' ? (
                    <button
                        onClick={() => handleCashout(multiplier)}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] text-lg"
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
                
                {status === 'exploded' && <div className="text-red-500 font-bold text-center">Boom! You hit a mine.</div>}
                {status === 'cashed_out' && <div className="text-green-500 font-bold text-center">You cashed out at {multiplier}x!</div>}
            </div>

            {/* Grid */}
            <div className="w-full md:w-2/3 flex items-center justify-center">
                <div className="grid grid-cols-5 gap-2 bg-[#0f172a] p-4 rounded-2xl border border-[#334155] aspect-square w-full max-w-[400px]">
                    {Array.from({length: 25}).map((_, i) => {
                        const isRevealed = clicked.includes(i) || status === 'exploded' || status === 'cashed_out';
                        const isMine = grid[i] === 'bomb';
                        return (
                            <button
                                key={i}
                                onClick={() => handleCellClick(i)}
                                disabled={isRevealed || status !== 'playing'}
                                className={`rounded-xl flex items-center justify-center text-3xl transition-all duration-300 transform ${
                                    !isRevealed 
                                        ? 'bg-[#1e293b] hover:bg-[#334155] shadow-inner border-b-4 border-[#0f172a]' 
                                        : isMine
                                            ? 'bg-red-500/20 border border-red-500/50'
                                            : 'bg-emerald-500/20 border border-emerald-500/50'
                                }`}
                            >
                                {isRevealed ? (isMine ? '💣' : '💎') : ''}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

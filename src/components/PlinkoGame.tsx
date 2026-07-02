import React, { useState } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { store } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export default function PlinkoGame({ betAmount, onError }: { betAmount: string; onError: (msg: string) => void }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    
    const [status, setStatus] = useState<'idle' | 'dropping' | 'finished'>('idle');
    const [resultMult, setResultMult] = useState(0);
    const [ballPos, setBallPos] = useState(0); // 0 to 14 bins

    const multipliers = [10, 5, 2, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 2, 5, 10];
    
    const handleDrop = () => {
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
            description: `Plinko Drop`
        });
        store.updateUser(user.id, { balance: user.balance - amt });
        
        setStatus('dropping');
        
        // Randomly simulate drops
        setTimeout(() => {
            // Biased random walk for Plinko
            let pos = Math.floor(multipliers.length / 2); // Start in middle
            for (let i = 0; i < 12; i++) {
                pos += Math.random() > 0.5 ? 0.5 : -0.5;
            }
            const finalIndex = Math.max(0, Math.min(multipliers.length - 1, Math.round(pos)));
            const mult = multipliers[finalIndex];
            
            setResultMult(mult);
            setStatus('finished');
            
            const winAmount = amt * mult;
            if (winAmount > 0) {
                store.addTransaction({
                    userId: user.id,
                    type: 'deposit',
                    amount: winAmount,
                    status: 'completed',
                    description: `Plinko Win (${mult}x)`
                });
                store.updateUser(user.id, { balance: user.balance + winAmount });
            }
        }, 1500);
    };

    return (
        <div className="bg-[#050b1a] rounded-3xl p-6 mb-6 flex flex-col items-center shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#1e293b]">
            <h2 className="text-2xl font-black text-pink-500 mb-6 uppercase drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">🟣 {t('Plinko')}</h2>
            
            <div className="w-full max-w-lg relative bg-[#0f172a] rounded-2xl p-6 border border-[#334155] shadow-inner flex flex-col items-center mb-6">
               
               {/* Simplified peg board */}
               <div className="flex flex-col items-center gap-2 mb-8">
                   {[...Array(12)].map((_, row) => (
                       <div key={row} className="flex gap-4">
                           {[...Array(row + 3)].map((_, col) => (
                               <div key={col} className="w-2 h-2 rounded-full bg-white/20 shadow-[0_0_5px_rgba(255,255,255,0.3)]"></div>
                           ))}
                       </div>
                   ))}
               </div>

               {/* Multiplier Bins */}
               <div className="flex gap-1 w-full justify-center">
                   {multipliers.map((m, i) => (
                       <div 
                         key={i} 
                         className={`flex-1 text-[10px] font-bold text-center py-2 rounded-md ${
                             m >= 5 ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' :
                             m >= 1.5 ? 'bg-purple-500 text-white' :
                             m >= 1 ? 'bg-blue-500 text-white' :
                             'bg-slate-700 text-gray-300'
                         }`}
                       >
                           {m}x
                       </div>
                   ))}
               </div>

               {status === 'dropping' && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-[1px]">
                       <motion.div 
                          animate={{ y: [0, 200], x: [0, (Math.random() - 0.5) * 100] }}
                          transition={{ duration: 1.5, ease: "easeIn" }}
                          className="w-4 h-4 rounded-full bg-pink-400 shadow-[0_0_15px_rgba(236,72,153,1)]"
                       />
                   </div>
               )}
            </div>

            <div className="w-full max-w-lg">
                <button
                    onClick={handleDrop}
                    disabled={status === 'dropping'}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.4)] text-lg uppercase disabled:opacity-50"
                >
                    {status === 'dropping' ? t('Dropping...') : t('Drop Ball')}
                </button>

                {status === 'finished' && (
                    <div className={`mt-4 text-center font-bold text-lg ${resultMult >= 1 ? 'text-green-400' : 'text-gray-400'}`}>
                        Result: {resultMult}x ({(parseFloat(betAmount) * resultMult).toFixed(2)} XRP)
                    </div>
                )}
            </div>
        </div>
    );
}

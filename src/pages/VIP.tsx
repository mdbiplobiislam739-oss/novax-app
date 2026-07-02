import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { store, VIP_LEVELS } from '../lib/store';
import { formatXRP } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Check, History as HistoryIcon, X } from 'lucide-react';

export default function VIP() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState<number | null>(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handlePurchase = (level: number, price: number) => {
    if (!user) return;
    if (user.balance < price) {
      setMsg({ text: 'Insufficient balance. Please recharge.', type: 'error' });
      return;
    }
    
    setLoading(level);
    setTimeout(() => {
      store.updateUser(user.id, {
        balance: user.balance - price,
        vipLevel: level
      });
      store.addTransaction({
        userId: user.id,
        type: 'purchase',
        amount: price,
        status: 'completed',
        description: `Upgraded to VIP ${level}`
      });
      refreshUser();
      setLoading(null);
      setMsg({ text: `Successfully upgraded to VIP ${level}!`, type: 'success' });
    }, 1500);
  };

  const handleCancelPlan = (level: number, price: number) => {
    if (!user) return;
    const confirmCancel = window.confirm(`Are you sure you want to cancel VIP ${level}? You will be refunded ${price} XRP to your balance.`);
    if (!confirmCancel) return;

    setLoading(level);
    setTimeout(() => {
      store.updateUser(user.id, {
        balance: user.balance + price,
        vipLevel: 0
      });
      store.addTransaction({
        userId: user.id,
        type: 'refund',
        amount: price,
        status: 'completed',
        description: `Refunded VIP ${level}`
      });
      refreshUser();
      setLoading(null);
      setMsg({ text: `VIP ${level} canceled. ${price} XRP refunded.`, type: 'success' });
    }, 1500);
  };

  const vipHistory = store.getState().transactions
    .filter(t => t.userId === user?.id && t.type === 'purchase')
    .sort((a, b) => b.timestamp - a.timestamp);

  const vipLevelsInfo = store.getState().vipLevels || VIP_LEVELS;

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 relative p-4">
       <div className="flex items-center justify-between py-2 sm:py-4">
         <div>
           <h1 className="text-xl sm:text-2xl font-bold text-gradient-gold">VIP Tiers</h1>
           <p className="text-text-muted mt-1 text-xs sm:text-sm">Upgrade your level to increase daily profit</p>
         </div>
         <button 
            onClick={() => setIsHistoryOpen(true)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center border border-[var(--color-border-card)] shrink-0 ml-2"
          >
            <HistoryIcon size={18} className="sm:w-5 sm:h-5" />
          </button>
       </div>

       {msg.text && (
         <div className={`p-4 rounded-2xl border text-sm ${msg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
           {msg.text}
         </div>
       )}

       <div className="space-y-4">
         {vipLevelsInfo.map((vip, i) => {
           const isCurrent = user?.vipLevel === vip.level;
           const isLocked = (user?.vipLevel || 0) >= vip.level;

           return (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               key={vip.level} 
               className={`relative overflow-hidden rounded-[2rem] p-6 border transition-all ${isCurrent ? 'border-brand-primary bg-gradient-to-br from-brand-primary/20 to-[var(--color-bg-base)] shadow-[0_0_20px_rgba(0,240,255,0.15)]' : 'border-[var(--color-border-card)] glass-panel'}`}
             >
               {isCurrent && (
                 <div className="absolute top-0 right-0 bg-brand-gold text-black text-xs font-bold px-3 py-1 rounded-bl-xl">
                   CURRENT TIER
                 </div>
               )}
               
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-xl font-bold flex items-center gap-2">
                     <Crown size={24} className={isCurrent ? "text-brand-gold" : "text-text-muted"} />
                     <span className={isCurrent ? "text-brand-gold" : ""}>{vip.name}</span>
                   </h3>
                   <div className="text-2xl font-bold mt-2">{formatXRP(vip.price)}</div>
                 </div>
                 <div className="text-right">
                   <div className="text-sm text-text-muted">Daily Profit</div>
                   <div className="text-lg font-bold text-brand-primary">+{formatXRP(vip.dailyIncome)}</div>
                 </div>
               </div>

               <div className="space-y-2 mb-4 sm:mb-6">
                 <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted">
                   <Check size={16} className="text-green-500 shrink-0" /> Validity: {vip.validityDays} Days
                 </div>
                 <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted">
                   <Check size={16} className="text-green-500 shrink-0" /> Daily Mining Included
                 </div>
                 <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted">
                   <Check size={16} className="text-green-500 shrink-0" /> Instant Withdrawal
                 </div>
               </div>

               <div className="space-y-3">
                 <button
                   onClick={() => handlePurchase(vip.level, vip.price)}
                   disabled={isLocked || loading === vip.level}
                   className={`w-full py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all ${
                     isCurrent ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/30 cursor-default' :
                     isLocked ? 'bg-[var(--color-border-card)] text-text-muted cursor-not-allowed' :
                     'bg-gradient-to-r from-brand-primary to-brand-gold text-black hover:opacity-90 shadow-[0_0_15px_rgba(255,90,0,0.2)]'
                   }`}
                 >
                   {loading === vip.level ? 'Processing...' : isCurrent ? 'Active Plan' : isLocked ? 'Unlocked' : `Unlock for ${formatXRP(vip.price)}`}
                 </button>
                 
                 {isCurrent && vip.level > 0 && (
                   <button
                     onClick={() => handleCancelPlan(vip.level, vip.price)}
                     disabled={loading === vip.level}
                     className="w-full py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20"
                   >
                     {loading === vip.level ? 'Processing...' : `Cancel Plan & Refund ${formatXRP(vip.price)} XRP`}
                   </button>
                 )}
               </div>
             </motion.div>
           );
         })}
       </div>

       <AnimatePresence>
        {isHistoryOpen && (
          <Modal onClose={() => setIsHistoryOpen(false)} title="VIP History">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {vipHistory.length === 0 ? (
                <div className="text-center py-10 text-text-muted">No VIP purchases found</div>
              ) : (
                vipHistory.map(tx => (
                  <div key={tx.id} className="bg-[var(--color-bg-base)] border border-[var(--color-border-card)] p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-brand-gold">{tx.description}</div>
                      <div className="text-xs text-text-muted mt-1">{new Date(tx.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="font-bold text-brand-primary">-{formatXRP(tx.amount)}</div>
                  </div>
                ))
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-card)] p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 bg-[var(--color-bg-base)] rounded-full text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

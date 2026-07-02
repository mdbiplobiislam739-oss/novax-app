import { ArrowLeft, Trophy, Users, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/TranslationContext';
import { store } from '../lib/store';
import { formatXRP } from '../lib/utils';
import { useState } from 'react';
import { motion } from 'motion/react';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'earnings' | 'referrals'>('earnings');

  const users = store.getState().users;

  const fakeUsers = [
    { id: 'f1', username: 'CryptoKing', balance: 452, createdAt: Date.now() - 10000000000, refCount: 15 },
    { id: 'f2', username: 'TRX_Whale', balance: 385, createdAt: Date.now() - 8000000000, refCount: 12 },
    { id: 'f3', username: 'SatoshiND', balance: 290, createdAt: Date.now() - 12000000000, refCount: 8 },
    { id: 'f4', username: 'Moon_🚀', balance: 175, createdAt: Date.now() - 5000000000, refCount: 6 },
    { id: 'f5', username: 'DiamondHands', balance: 142, createdAt: Date.now() - 15000000000, refCount: 4 },
    { id: 'f6', username: 'JustinS', balance: 98, createdAt: Date.now() - 7000000000, refCount: 2 },
    { id: 'f7', username: 'BullRun2024', balance: 85, createdAt: Date.now() - 4000000000, refCount: 1 },
    { id: 'f8', username: 'HODLer', balance: 67, createdAt: Date.now() - 9000000000, refCount: 0 },
    { id: 'f9', username: 'DeFi_Master', balance: 54, createdAt: Date.now() - 3000000000, refCount: 0 },
    { id: 'f10', username: 'Web3_Dev', balance: 42, createdAt: Date.now() - 2000000000, refCount: 0 },
  ] as any[];

  // Top by balance
  const topEarners = [...users, ...fakeUsers].sort((a, b) => (b.balance || 0) - (a.balance || 0)).slice(0, 10);
  
  // Top by referrals
  const aggregatedReferrals = [...users].map(u => {
    const refs = users.filter(sub => sub.referrerId === u.id);
    return { ...u, refCount: refs.length };
  });

  const topReferrers = [...aggregatedReferrals, ...fakeUsers].sort((a, b) => (b.refCount || 0) - (a.refCount || 0)).slice(0, 10);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center border border-[var(--color-border-card)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{t('Leaderboard')}</h1>
      </div>

      <div className="flex bg-[var(--color-bg-card)] p-1 rounded-2xl border border-[var(--color-border-card)]">
        <button 
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${tab === 'earnings' ? 'bg-brand-primary text-black shadow-md' : 'text-text-muted hover:text-white'}`}
          onClick={() => setTab('earnings')}
        >
          Top Earners
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${tab === 'referrals' ? 'bg-brand-primary text-black shadow-md' : 'text-text-muted hover:text-white'}`}
          onClick={() => setTab('referrals')}
        >
          Top Referrers
        </button>
      </div>

      <div className="space-y-3">
        {(tab === 'earnings' ? topEarners : topReferrers).map((user, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={user.id} 
            className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] p-4 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg 
                ${index === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 
                  index === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' : 
                  index === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' : 
                  'bg-white/5 text-text-muted'}`}
              >
                {index < 3 ? <Medal size={20} /> : `#${index + 1}`}
              </div>
              <div>
                <div className="font-bold">{user.username}</div>
                <div className="text-xs text-text-muted">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="text-right">
              {tab === 'earnings' ? (
                <>
                  <div className="text-xs text-text-muted mb-1">Balance</div>
                  <div className="font-bold text-brand-primary">{formatXRP(user.balance)}</div>
                </>
              ) : (
                <>
                  <div className="text-xs text-text-muted mb-1">Referrals</div>
                  <div className="font-bold text-white flex items-center justify-end gap-1"><Users size={14}/> {(user as any).refCount}</div>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

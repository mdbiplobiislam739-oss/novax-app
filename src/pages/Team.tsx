import { useAuth } from '../contexts/AuthContext';
import { Users, Copy, CheckCircle2, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatXRP } from '../lib/utils';
import { store } from '../lib/store';

export default function Team() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeLevelTab, setActiveLevelTab] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const handleUpdate = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('store_updated', handleUpdate);
    return () => window.removeEventListener('store_updated', handleUpdate);
  }, []);

  const _origin = typeof window !== 'undefined' ? window.location.origin : 'https://trxhub.com';
  const refLink = `${_origin}/register?ref=${user?.username}`;

  const copyRef = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allUsers = store.getState().users;
  
  const l1Users = allUsers.filter(u => {
    const ref = (u.referrerId || '').trim().toLowerCase();
    const currentUsername = (user?.username || '').trim().toLowerCase();
    const isAdmin = user?.role === 'admin';
    if (!currentUsername) return false;
    return ref === currentUsername || (isAdmin && ref === 'admin');
  });
  
  const l2Users = allUsers.filter(u => {
    const ref = (u.referrerId || '').trim().toLowerCase();
    if (!ref) return false;
    return l1Users.some(l1 => l1.username && l1.username.trim().toLowerCase() === ref);
  });

  const l3Users = allUsers.filter(u => {
    const ref = (u.referrerId || '').trim().toLowerCase();
    if (!ref) return false;
    return l2Users.some(l2 => l2.username && l2.username.trim().toLowerCase() === ref);
  });
  
  const teamSize = l1Users.length + l2Users.length + l3Users.length;
  
  const allTxs = store.getState().transactions;
  const teamReward = allTxs
    .filter(t => t.userId === user?.id && t.type === 'reward' && (t.description?.includes('Team') ?? false))
    .reduce((sum, t) => sum + t.amount, 0);

  const getLevelReward = (level: number) => {
    return allTxs
      .filter(t => t.userId === user?.id && t.type === 'reward' && (t.description?.includes(`Level ${level}`) ?? false))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const { referralSystemEnabled = true, referralLevel1Rate = 10, referralLevel2Rate = 5, referralLevel3Rate = 2 } = store.getState();

  if (!referralSystemEnabled) {
    return (
      <div className="space-y-6 pb-6 mt-10">
        <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center justify-center">
          <Users size={48} className="text-text-muted mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Referral System Offline</h2>
          <p className="text-text-muted text-sm max-w-xs mx-auto">The team building and referral program is currently disabled by the administrator. Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Users className="text-brand-primary" /> My Team
        </h1>
        <p className="text-text-muted mt-1 text-sm">Grow your team and earn massive rewards!</p>
      </div>

      <div className="bg-gradient-to-r from-brand-primary/20 to-brand-gold/20 border border-brand-primary/30 rounded-3xl p-5 mb-6">
        <h3 className="text-brand-gold font-bold mb-3 flex items-center gap-2">
          <TrendingUp size={18} /> Referral Bonuses
        </h3>
        <ul className="space-y-2 text-sm text-white/90">
          <li className="flex justify-between items-center"><span className="text-text-muted">Level 1 (Direct):</span> <span className="font-bold text-green-400">{referralLevel1Rate}% Commission</span></li>
          <li className="flex justify-between items-center"><span className="text-text-muted">Level 2 (Indirect):</span> <span className="font-bold text-green-400">{referralLevel2Rate}% Commission</span></li>
          <li className="flex justify-between items-center"><span className="text-text-muted">Level 3 (Sub):</span> <span className="font-bold text-green-400">{referralLevel3Rate}% Commission</span></li>
        </ul>
      </div>

      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-5">
           <Users size={120} />
        </div>
        <h3 className="font-bold text-lg mb-4">Invitation Link</h3>
        <div className="bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="text-sm text-text-muted truncate flex-1">
            {refLink}
          </div>
          <button 
            onClick={copyRef}
            className="w-10 h-10 shrink-0 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center hover:bg-brand-primary/20 transition-colors"
          >
            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
           <span className="text-text-muted">Invitation Code:</span>
           <span className="font-bold text-brand-gold">{user?.username}</span>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-3xl flex flex-col items-center justify-center text-center">
           <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-3">
             <Users size={24} />
           </div>
           <div className="text-sm text-text-muted mb-1">Team Size</div>
           <div className="text-2xl font-bold">{teamSize}</div>
        </div>
        <div className="glass-panel p-5 rounded-3xl flex flex-col items-center justify-center text-center">
           <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-3">
             <TrendingUp size={24} />
           </div>
           <div className="text-sm text-text-muted mb-1">Team Reward</div>
           <div className="text-xl font-bold text-green-500">{formatXRP(teamReward)}</div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden mt-6">
         <div className="p-4 border-b border-[var(--color-border-card)] font-bold">
           Level Details
         </div>
         <div className="divide-y divide-[var(--color-border-card)] text-sm">
             <div className="p-4 flex justify-between items-center">
               <div>
                 <div className="font-bold text-brand-primary">Level 1 ({referralLevel1Rate}%)</div>
                 <div className="text-text-muted text-xs mt-1">Direct Invites</div>
               </div>
               <div className="text-right">
                 <div className="font-bold">{l1Users.length} Members</div>
                 <div className="text-text-muted text-xs mt-1">{formatXRP(getLevelReward(1))}</div>
               </div>
             </div>
             <div className="p-4 flex justify-between items-center">
               <div>
                 <div className="font-bold text-brand-gold">Level 2 ({referralLevel2Rate}%)</div>
                 <div className="text-text-muted text-xs mt-1">Indirect Invites</div>
               </div>
               <div className="text-right">
                 <div className="font-bold">{l2Users.length} Members</div>
                 <div className="text-text-muted text-xs mt-1">{formatXRP(getLevelReward(2))}</div>
               </div>
             </div>
             <div className="p-4 flex justify-between items-center">
               <div>
                 <div className="font-bold text-blue-400">Level 3 ({referralLevel3Rate}%)</div>
                 <div className="text-text-muted text-xs mt-1">Sub-Invites</div>
               </div>
               <div className="text-right">
                 <div className="font-bold">{l3Users.length} Members</div>
                 <div className="text-text-muted text-xs mt-1">{formatXRP(getLevelReward(3))}</div>
               </div>
             </div>
          </div>
       </div>

       {/* Detailed Team List Panel */}
       <div className="glass-panel rounded-3xl overflow-hidden mt-6">
         <div className="p-4 border-b border-[var(--color-border-card)] flex items-center justify-between">
           <span className="font-bold text-white">Team Members List</span>
           <span className="text-xs text-text-muted bg-[var(--color-bg-base)] px-2.5 py-1 rounded-full border border-[var(--color-border-card)]">{teamSize} Total Members</span>
         </div>
         
         <div className="flex border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]/40 font-semibold text-sm">
           <button 
             onClick={() => setActiveLevelTab(1)}
             className={`flex-1 py-3 text-center border-b-2 transition-all duration-200 ${activeLevelTab === 1 ? 'border-brand-primary text-brand-primary bg-brand-primary/5 font-bold' : 'border-transparent text-text-muted hover:text-white'}`}
           >
             Level 1 ({l1Users.length})
           </button>
           <button 
             onClick={() => setActiveLevelTab(2)}
             className={`flex-1 py-3 text-center border-b-2 transition-all duration-200 ${activeLevelTab === 2 ? 'border-brand-primary text-brand-primary bg-brand-primary/5 font-bold' : 'border-transparent text-text-muted hover:text-white'}`}
           >
             Level 2 ({l2Users.length})
           </button>
           <button 
             onClick={() => setActiveLevelTab(3)}
             className={`flex-1 py-3 text-center border-b-2 transition-all duration-200 ${activeLevelTab === 3 ? 'border-brand-primary text-brand-primary bg-brand-primary/5 font-bold' : 'border-transparent text-text-muted hover:text-white'}`}
           >
             Level 3 ({l3Users.length})
           </button>
         </div>
         
         <div className="p-4 bg-[var(--color-bg-card)]/20">
           {((activeLevelTab === 1 ? l1Users : activeLevelTab === 2 ? l2Users : l3Users)).length === 0 ? (
             <div className="text-center py-10 text-text-[var(--color-text-muted)] flex flex-col items-center justify-center">
               <Users size={32} className="mx-auto mb-2 opacity-30" />
               <p className="text-sm text-text-muted">No members registered in this level yet.</p>
             </div>
           ) : (
             <div className="space-y-3 max-h-72 overflow-y-auto pr-1 flex flex-col">
               {((activeLevelTab === 1 ? l1Users : activeLevelTab === 2 ? l2Users : l3Users)).map((u) => (
                 <div key={u.id} className="bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-2xl p-4 flex items-center justify-between hover:border-brand-primary/30 transition-all duration-200">
                   <div className="space-y-1 text-left">
                     <div className="font-bold text-white flex items-center gap-2">
                       <span>{u.username}</span>
                       {u.vipLevel > 0 && (
                         <span className="bg-brand-gold/20 text-brand-gold border border-brand-gold/30 text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                           VIP {u.vipLevel}
                         </span>
                       )}
                     </div>
                     <div className="text-xs text-text-muted font-mono">{u.phone ? u.phone.replace(/(\d{3})\d{5}(\d{2})/, '$1*****$2') : 'No Phone'}</div>
                   </div>
                   <div className="text-right">
                     <div className="text-xs text-brand-gold font-semibold">Joined {new Date(u.createdAt).toLocaleDateString()}</div>
                     <div className="text-[10px] text-text-muted mt-0.5">Invited by: <span className="text-white/80 font-medium font-mono">{u.referrerId || 'None'}</span></div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       </div>
    </div>
  );
}

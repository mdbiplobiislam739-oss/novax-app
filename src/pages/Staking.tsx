import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../lib/store';
import { Lock, Timer, Info, CheckCircle, TrendingUp, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { formatXRP } from '../lib/utils';
import { StakeRecord } from '../types';
import { CRYPTO_TOKENS, useTokens } from '../lib/tokens';
import { usePreferredCurrency } from '../hooks/usePreferredCurrency';

export default function Staking() {
  const { user } = useAuth();
  const tokens = useTokens();
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('1');
  const [selectedCurrencyId, setSelectedCurrencyId] = usePreferredCurrency('XRP');
  const selectedCurrency = tokens.find(t => t.symbol === selectedCurrencyId) || tokens[0];
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'stake' | 'my_stakes'>('stake');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('store_updated', handleUpdate);
    return () => window.removeEventListener('store_updated', handleUpdate);
  }, []);

  const stakeSettings = store.getState().stakeSettings || { interestRate: 90, minStake: 200, maxStake: 4000 };
  const INTEREST_RATE = stakeSettings.interestRate;
  const MIN_STAKE = stakeSettings.minStake;
  const MAX_STAKE = stakeSettings.maxStake;

  const numAmount = parseFloat(amount) || 0;
  const numDuration = parseInt(duration) || 1;
  const expectedReturn = numAmount + (numAmount * (INTEREST_RATE / 100) * numDuration);

  const stakes = store.getState().stakes?.filter(s => s.userId === user?.id).sort((a,b) => b.startDate - a.startDate) || [];

  const getAvailableBalance = (token: typeof CRYPTO_TOKENS[0]) => {
    if (!user) return 0;
    if (token.symbol === 'XRP') {
      return user.balance || 0;
    }
    return user.balances?.[token.symbol] || 0;
  };
  const availableBalance = getAvailableBalance(selectedCurrency);

  const handleStake = async () => {
    setError('');
    setSuccess('');
    
    if (!user) return;
    
    if (numAmount <= 0) {
      setError(`Amount must be greater than 0 ${selectedCurrency.symbol}`);
      return;
    }

    if (numAmount < MIN_STAKE || numAmount > MAX_STAKE) {
      setError(`Amount must be between ${MIN_STAKE} and ${MAX_STAKE} ${selectedCurrency.symbol}`);
      return;
    }
    
    if (numAmount > availableBalance) {
      setError('Insufficient balance');
      return;
    }

    if (numDuration < 1 || numDuration > 24) {
      setError('Duration must be between 1 and 24 months');
      return;
    }

    // Deduct balance
    if (selectedCurrency.symbol === 'XRP') {
      await store.updateUser(user.id, { balance: user.balance - numAmount });
    } else {
      const updatedBalances = { ...(user.balances || {}) };
      updatedBalances[selectedCurrency.symbol] = (updatedBalances[selectedCurrency.symbol] || 0) - numAmount;
      await store.updateUser(user.id, { balances: updatedBalances });
    }
    
    // Create transaction record
    await store.addTransaction({
      userId: user.id,
      type: 'stake',
      amount: numAmount,
      status: 'completed',
      description: `Staked ${numAmount} ${selectedCurrency.symbol} for ${numDuration} months`
    });

    // Create stake record
    const startDate = Date.now();
    const endDate = startDate + (numDuration * 30 * 24 * 60 * 60 * 1000); // approx months

    await store.addStake({
      userId: user.id,
      amount: numAmount,
      currency: selectedCurrency.symbol,
      durationMonths: numDuration,
      interestRate: INTEREST_RATE,
      expectedReturn,
      startDate,
      endDate,
      status: 'active',
      timestamp: Date.now()
    });

    setAmount('');
    setSuccess(`Successfully staked ${numAmount} ${selectedCurrency.symbol} for ${numDuration} months!`);
    
    // Auto clear success message
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 p-4">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="text-brand-primary" size={28} />
        <h1 className="text-2xl font-bold">Crypto Staking</h1>
      </div>

      <div className="flex gap-2 p-1 bg-[var(--color-bg-base)] rounded-xl border border-[var(--color-border-card)]">
        <button
          onClick={() => setActiveTab('stake')}
          className={`flex-1 py-3 font-semibold rounded-lg transition-colors ${
            activeTab === 'stake' ? 'bg-[var(--color-bg-card)] shadow-sm text-brand-primary' : 'text-text-muted hover:text-white'
          }`}
        >
          Stake Asset
        </button>
        <button
          onClick={() => setActiveTab('my_stakes')}
          className={`flex-1 py-3 font-semibold rounded-lg transition-colors ${
            activeTab === 'my_stakes' ? 'bg-[var(--color-bg-card)] shadow-sm text-brand-primary' : 'text-text-muted hover:text-white'
          }`}
        >
          My Stakes
        </button>
      </div>

      {activeTab === 'stake' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted">Available Balance:</span>
              <span className="font-bold text-brand-gold">{availableBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedCurrency.symbol}</span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle size={16} /> {success}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-text-muted mb-2 block">
                Select Asset
              </label>
              <div className="relative">
                <select
                  value={selectedCurrency.symbol}
                  onChange={(e) => setSelectedCurrencyId(e.target.value)}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  {tokens.map((token) => (
                    <option key={token.symbol} value={token.symbol}>{token.name} ({token.symbol})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-muted mb-2 flex justify-between">
                <span>Amount to Stake ({selectedCurrency.symbol})</span>
                <span>Limits: {MIN_STAKE} - {MAX_STAKE}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter ${selectedCurrency.symbol} amount`}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
                <button
                  onClick={() => setAmount(Math.min(availableBalance, MAX_STAKE).toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded-lg font-bold"
                >
                  MAX
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-muted mb-2 block">
                Duration (Months)
              </label>
              <div className="relative">
                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 pl-10 pr-4 text-white appearance-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  {[...Array(24)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} Month{i > 0 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[var(--color-bg-base)] rounded-xl p-4 space-y-3 border border-[var(--color-border-card)]">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">Monthly Interest Rate:</span>
                <span className="text-green-500 font-bold">{INTEREST_RATE}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-text-muted">Expected Interest:</span>
                 <span className="text-white">+{((numAmount * (INTEREST_RATE / 100) * numDuration) || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedCurrency.symbol}</span>
              </div>
              <div className="pt-3 border-t border-[var(--color-border-card)] flex justify-between items-center">
                <span className="font-medium text-text-muted">Total Return</span>
                <span className="font-bold text-xl text-brand-gold">{(expectedReturn || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedCurrency.symbol}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
               <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
               <p className="text-xs text-blue-400/90 leading-relaxed">
                 Staked balances are locked over the selected duration. Capital and interest will be released automatically when the period completes.
               </p>
            </div>

            <button
              onClick={handleStake}
              disabled={!amount || numAmount < MIN_STAKE || numAmount > MAX_STAKE}
               className="w-full bg-gradient-to-r from-brand-primary to-brand-gold text-black font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Stake
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === 'my_stakes' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {stakes.length === 0 ? (
            <div className="text-center py-10 glass-panel rounded-3xl">
              <TrendingUp className="mx-auto text-text-muted mb-3" size={40} />
              <div className="text-text-muted">No active stakes found.</div>
            </div>
          ) : (
             stakes.map(stake => (
               <div key={stake.id} className="glass-panel p-5 rounded-3xl relative overflow-hidden">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <div className="text-2xl font-bold text-white mb-1">{(stake.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} {stake.currency || 'XRP'}</div>
                     <div className="text-xs text-text-muted">Locked for {stake.durationMonths} months @ {INTEREST_RATE}%/mo</div>
                   </div>
                   <div className={`px-3 py-1 rounded-full text-xs font-bold ${stake.status === 'active' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                     {stake.status.toUpperCase()}
                   </div>
                 </div>
                 
                 <div className="bg-[var(--color-bg-base)] p-3 rounded-xl border border-[var(--color-border-card)] space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Start Date:</span>
                      <span className="text-white">{new Date(stake.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">Unlock Date:</span>
                      <span className="text-white">{new Date(stake.endDate).toLocaleDateString()}</span>
                    </div>
                 </div>
                 
                 <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
                   <span className="text-text-muted">Expected Return:</span>
                   <span className="font-bold text-brand-gold">{(stake.expectedReturn || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} {stake.currency || 'XRP'}</span>
                 </div>
               </div>
             ))
          )}
        </motion.div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Gift, CheckCircle, Calendar, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { store } from '../lib/store';
import { useTranslation } from '../contexts/TranslationContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export default function DailyCheckIn() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [msg, setMsg] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  
  const dailyRewards = store.getState().dailyRewards || [2, 5, 10, 15, 20, 30, 50];
  const REWARDS = dailyRewards.map((amount, idx) => ({ day: idx + 1, amount }));
  
  const now = new Date();
  
  // Calculate if user can check in today
  let canCheckIn = true;
  let streak = currentUser?.checkInStreak || 0;
  let lastCheckIn = currentUser?.lastCheckInTimestamp || 0;
  
  if (lastCheckIn) {
    const lastDate = new Date(lastCheckIn);
    // Check if it's the exact same day
    if (
      lastDate.getFullYear() === now.getFullYear() &&
      lastDate.getMonth() === now.getMonth() &&
      lastDate.getDate() === now.getDate()
    ) {
      canCheckIn = false;
    }
    
    // Check if the streak is broken (more than 48 hours passed since start of last check-in date)
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (
      lastDate.getFullYear() < yesterday.getFullYear() ||
      (lastDate.getFullYear() === yesterday.getFullYear() && lastDate.getMonth() < yesterday.getMonth()) ||
      (lastDate.getFullYear() === yesterday.getFullYear() && lastDate.getMonth() === yesterday.getMonth() && lastDate.getDate() < yesterday.getDate())
    ) {
      // It was before yesterday, streak broken!
      // But actually handled in claim logic
    }
  }

  const handleClaim = () => {
    if (!currentUser) return;
    if (!canCheckIn) {
      setMsg("You have already checked in today!");
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    
    setIsClaiming(true);
    
    // Recalculate streak to ensure accuracy
    let newStreak = streak;
    if (lastCheckIn) {
      const lastDate = new Date(lastCheckIn);
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      
      const isYesterday = lastDate.getFullYear() === yesterday.getFullYear() &&
                          lastDate.getMonth() === yesterday.getMonth() &&
                          lastDate.getDate() === yesterday.getDate();
                          
      if (isYesterday) {
        newStreak += 1;
      } else {
        newStreak = 1; // broken streak
      }
    } else {
      newStreak = 1;
    }
    
    if (newStreak > 7) {
      newStreak = 1; // Reset after 7 days
    }
    
    const rewardAmount = REWARDS.find(r => r.day === newStreak)?.amount || 2;
    
    setTimeout(async () => {
      try {
        await store.updateUser(currentUser.id, {
          balance: (currentUser.balance || 0) + rewardAmount,
          lastCheckInTimestamp: Date.now(),
          checkInStreak: newStreak,
        });
        
        await store.addTransaction({
          userId: currentUser.id,
          type: 'reward' as any,
          amount: rewardAmount,
          status: 'completed',
          description: 'Daily Check-in Bonus'
        });
        
        setIsClaiming(false);
        setMsg(`🎉 Claimed ${rewardAmount} XRP successfully!`);
        setTimeout(() => setMsg(""), 3000);
      } catch (err) {
        setIsClaiming(false);
        setMsg("Failed to claim. Please try again.");
        setTimeout(() => setMsg(""), 3000);
      }
    }, 1500); // Simulate network delay for nice animation
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center border border-[var(--color-border-card)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{t('Daily Bonus') || "Daily Bonus"}</h1>
      </div>

      {msg && (
        <div className="p-4 bg-brand-primary/20 text-brand-primary rounded-xl text-center font-bold text-sm border border-brand-primary/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          {msg}
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#18181D] to-[#252530] rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-lg">
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#00FFFF]/20 rounded-full blur-3xl z-0" />
        <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-[#FF007A]/20 rounded-full blur-3xl z-0" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#00FFFF] to-[#FF007A] flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)] mb-4">
            <Gift size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t("Daily Check-in")}</h2>
          <p className="text-text-muted text-sm mb-6 max-w-[250px]">
            {t("Log in every day to claim your free XRP rewards. Maintain a 7-day streak for the grand prize!")}
          </p>
          
          <button
            onClick={handleClaim}
            disabled={!canCheckIn || isClaiming}
            className={`w-full max-w-[200px] py-3 px-6 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              canCheckIn 
                ? 'bg-gradient-to-r from-[#00FFFF] to-[#00BFFF] text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 active:scale-95' 
                : 'bg-[var(--color-bg-card)] text-gray-500 border border-[var(--color-border-card)] cursor-not-allowed'
            }`}
          >
            {isClaiming ? (
              <Sparkles className="animate-spin" size={20} />
            ) : canCheckIn ? (
              <>
                <Zap size={20} className="fill-black" />
                {t("Claim Now")}
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                {t("Claimed")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rewards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar className="text-[#00FFFF]" size={20} />
            {t("7-Day Streak")}
          </h3>
          <span className="text-xs font-semibold bg-[#FF007A]/10 text-[#FF007A] px-2 py-1 rounded-md">
            Streak: {streak}/7
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {REWARDS.map((reward, i) => {
            const isCompleted = i < streak || (!canCheckIn && i === streak - 1);
            const isToday = canCheckIn ? i === streak : i === streak;
            const isBigReward = reward.day === 7;
            
            return (
              <motion.div
                key={reward.day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col items-center justify-center rounded-2xl p-3 border transition-all ${
                  isBigReward ? 'col-span-4 h-24' : 'col-span-1 aspect-square'
                } ${
                  isCompleted 
                    ? 'bg-[#00FFFF]/10 border-[#00FFFF]/30' 
                    : isToday && canCheckIn
                    ? 'bg-brand-primary/20 border-brand-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-[var(--color-bg-card)] border-[var(--color-border-card)] opacity-70'
                }`}
              >
                {isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-2xl z-10">
                    <CheckCircle className="text-[#00FFFF]" size={isBigReward ? 32 : 24} />
                  </div>
                )}
                
                <span className={`text-xs font-bold mb-1 ${isCompleted ? 'text-gray-400' : 'text-text-muted'}`}>Day {reward.day}</span>
                
                <div className={`flex items-center gap-1 font-bold ${isBigReward ? 'text-2xl text-[#FF007A]' : 'text-lg text-[#00FFFF]'}`}>
                  <img src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" alt="XRP" className={`rounded-full shadow-lg ${isBigReward ? 'w-6 h-6' : 'w-4 h-4'}`} style={{ filter: "drop-shadow(0 0 5px rgba(0,240,255,0.5))" }} />
                  +{reward.amount}
                </div>
                
                {isBigReward && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-50">
                    <Gift size={40} className="text-[#FF007A]" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

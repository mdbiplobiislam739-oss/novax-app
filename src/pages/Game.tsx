import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../lib/store';
import { Coins, Trophy, ArrowLeft, RefreshCw, HandCoins, Rocket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/TranslationContext';
import FishGame from '../components/FishGame';
import MinesGame from '../components/MinesGame';
import PlinkoGame from '../components/PlinkoGame';
import TowerGame from '../components/TowerGame';
import { playSound } from '../lib/audio';

export default function Game() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'lobby' | 'coin' | 'dice' | 'crash' | 'rocket' | 'slots' | 'fish' | 'wheel' | 'mines' | 'plinko' | 'tower'>('lobby');
  const [betAmount, setBetAmount] = useState<string>('10');
  const [activeBetAmount, setActiveBetAmount] = useState<number>(0);
  
  // Coin states
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  
  // Dice states
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceTarget, setDiceTarget] = useState<number>(50); // Under 50 target by default

  // Slots states
  const [isSpinning, setIsSpinning] = useState(false);
  const slotSymbols = ['💎', '💰', '🤠', '🐴', '🔫', '🍒', 'A', 'K', 'Q', 'J'];
  const [slotsResult, setSlotsResult] = useState<string[][]>([
    ['💎', 'A', 'Q', 'K', '🤠'],
    ['💰', '🤠', '💎', 'J', '🍒'],
    ['🐴', '🔫', '💰', '🍒', 'A']
  ]);
  const [slotsWinMultipliers, setSlotsWinMultipliers] = useState<number>(0);

  // Wheel states
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelMultiplier, setWheelMultiplier] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState<number>(0);

  // Crash states (Crash Rocket / Crazy Worm)
  const [isCrashed, setIsCrashed] = useState(false);
  const [isCrashFlying, setIsCrashFlying] = useState(false);
  const [crashMultiplier, setCrashMultiplier] = useState(1.00);
  const [crashHistory, setCrashHistory] = useState<number[]>([]);
  const [crashTimeToStart, setCrashTimeToStart] = useState(5000);
  const [crashRoundId, setCrashRoundId] = useState(-1);
  const [fakeBets, setFakeBets] = useState<any[]>([]);

  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashedOutAmount, setCashedOutAmount] = useState(0);
  const [targetOdd, setTargetOdd] = useState<string>('2.00');
  const [cashedOutMultiplier, setCashedOutMultiplier] = useState(0);
  
  const [crashAutoRound, setCrashAutoRound] = useState(10);
  const [autoBetEnabled, setAutoBetEnabled] = useState(false);
  const [turboEnabled, setTurboEnabled] = useState(false);
  
  const crashLoopRef = useRef<number>();
  const crashStartTimeRef = useRef<number>(0);
  const crashTargetRef = useRef<number>(0);
  const crashBetBtnRef = useRef<HTMLButtonElement>(null);

  const [winStatus, setWinStatus] = useState<'win' | 'lose' | null>(null);
  const [error, setError] = useState('');
  const [hasActiveBetThisRound, setHasActiveBetThisRound] = useState(false);

  // Auto Bet Loop & Game Loop integration
  useEffect(() => {
     let timer: NodeJS.Timeout;
     if (!isCrashFlying && !isCrashed && autoBetEnabled && crashAutoRound > 0 && crashTimeToStart > 0 && crashTimeToStart < 4000 && !hasActiveBetThisRound) {
         setCrashAutoRound(prev => prev - 1);
         crashBetBtnRef.current?.click();
     }
     return () => clearTimeout(timer);
  }, [isCrashFlying, isCrashed, autoBetEnabled, crashAutoRound, crashTimeToStart, hasActiveBetThisRound]);

  // Deterministic Crash Game Loop
  useEffect(() => {
    let frameId: number;
    let prevRoundId = -1;
    let lastFlyTick = 0;

    const mulberry32 = (a: number) => {
      return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      }
    };

    const updateGame = () => {
      const now = Date.now();
      const ANCHOR_INTERVAL = 10 * 60 * 1000;
      const anchor = now - (now % ANCHOR_INTERVAL) - ANCHOR_INTERVAL;
      
      let current = anchor;
      let history: number[] = [];
      let phase: 'waiting' | 'flying' | 'crashed' = 'waiting';
      let multiplier = 1.00;
      let timeToStart = 0;
      let target = 1.00;
      let roundId = 0;

      // Seed modifier based on active app so they don't sync up 
      const seedModifier = activeTab === 'rocket' ? 0 : 98765;
      const state = store.getState();
      const currentWinRate = activeTab === 'rocket' 
        ? (state.gameRocketWinRate !== undefined ? state.gameRocketWinRate : 48)
        : (state.gameCrashWinRate !== undefined ? state.gameCrashWinRate : 48);
      
      // Calculate house edge. If winRate is 48 (meaning 48% chance to win 2x), RTP is 0.96 (4% edge)
      // Base RTP = (currentWinRate / 50) * 0.96 -> roughly matches previous logic.
      // Easiest edge representation: edge = 1.0 - (currentWinRate / 50)
      const rtp = Math.max(0.01, (currentWinRate / 50) * 0.96);
      const edge = 1 - rtp;
      
      while (current <= now) {
          let rng = mulberry32(current + seedModifier);
          const r = rng();
          let nextTarget = 1.00;
          if (r > edge) nextTarget = Math.max(1.01, rtp / rng());
          nextTarget = Math.min(500, parseFloat(nextTarget.toFixed(2))); // max 500x
          
          const flightDuration = Math.log(nextTarget) * 5000;
          const waitingDuration = 10000; // Increased to 10s based on request
          const crashedDuration = 3000; 
          const totalDuration = waitingDuration + flightDuration + crashedDuration;
          
          if (current + totalDuration > now) {
              const elapsed = now - current;
              target = nextTarget;
              if (elapsed < waitingDuration) {
                  phase = 'waiting';
                  timeToStart = waitingDuration - elapsed;
                  multiplier = 1.00;
              } else if (elapsed < waitingDuration + flightDuration) {
                  phase = 'flying';
                  const flightElapsed = elapsed - waitingDuration;
                  multiplier = Math.pow(Math.E, flightElapsed / 5000);
              } else {
                  phase = 'crashed';
                  multiplier = nextTarget;
              }
              break;
          }
          
          history.unshift(nextTarget);
          if (history.length > 15) history.pop();
          
          current += totalDuration;
          roundId++;
      }
      
      setIsCrashed(phase === 'crashed');
      if (phase === 'crashed' && !isCrashed) {
        // crash sound removed
      }

      setIsCrashFlying(phase === 'flying');
      setCrashMultiplier(multiplier);
      setCrashTimeToStart(timeToStart);
      setCrashHistory(history);
      
      if (roundId !== prevRoundId) {
          prevRoundId = roundId;
          setCrashRoundId(roundId);
      }
      
      frameId = requestAnimationFrame(updateGame);
    };
    
    frameId = requestAnimationFrame(updateGame);
    return () => cancelAnimationFrame(frameId);
  }, [activeTab]);

  // Handle round changes
  useEffect(() => {
    setHasCashedOut(false);
    setHasActiveBetThisRound(false);
    setCashedOutAmount(0);
    setCashedOutMultiplier(0);
    setWinStatus(null);
    
    // Generate fake bets for history list
    const mulberry32 = (a: number) => {
      return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      }
    };
    
    const names = ["0***9", "s***n", "a***0", "D***5", "0***2", "r***3", "m***u", "k***l", "T***x", "z***1"];
    const rng = mulberry32(crashRoundId + 12345);
    const bets = [];
    const numBets = 15 + Math.floor(rng() * 15);
    for(let i=0; i < numBets; i++) {
        const amt = [5, 10, 20, 25, 50, 100, 150][Math.floor(rng() * 7)];
        const name = names[Math.floor(rng() * names.length)];
        let cashoutMulti = 0;
        if (rng() > 0.4) {
            cashoutMulti = 1.01 + rng() * 4;
        }
        bets.push({
            id: i,
            name,
            betAmount: amt,
            cashoutMultiplier: parseFloat(cashoutMulti.toFixed(2))
        });
    }
    setFakeBets(bets.sort((a,b) => b.betAmount - a.betAmount));
  }, [crashRoundId]);


  const handlePlayCrash = async () => {
    if (!user) return;
    if (isCrashFlying || isCrashed) {
        setError(t('Wait for next round'));
        return;
    }
    const amount = Number(betAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError(t('Enter a valid amount'));
      return;
    }
    
    if (amount > user.balance) {
      setError(t('Insufficient balance'));
      return;
    }

    setError('');
    // Ensure we don't double bet
    if (hasActiveBetThisRound) return;
    setHasActiveBetThisRound(true);
    setActiveBetAmount(amount);
    playSound('bet');

    // Secure bet deduction now handled via store.updateUser wrapper
    // Update local state optimistically
    await store.updateUser(user.id, {
      balance: user.balance - amount
    });

    await store.addTransaction({
      userId: user.id,
      type: 'transfer',
      amount: -amount,
      status: 'completed',
      description: `Bet on Crash Game`
    });
  };

  const handleCashoutCrash = async () => {
      if (!isCrashFlying || hasCashedOut || isCrashed || !user || !hasActiveBetThisRound) return;
      
      const amount = activeBetAmount;
      const currentMulti = parseFloat(crashMultiplier.toFixed(2));
      const winAmount = amount * currentMulti;

      setHasCashedOut(true);
      setCashedOutAmount(winAmount);
      setCashedOutMultiplier(currentMulti);
      setWinStatus('win');
      playSound('win');

      await store.updateUser(user.id, {
        balance: (store.getState().users.find(u => u.id === user.id)?.balance || user.balance) + winAmount
      });
      
      await store.addTransaction({
        userId: user.id,
        type: 'reward' as any,
        amount: winAmount,
        status: 'completed',
        description: `Cashed out at ${currentMulti}x on Crash`
      });
  };

  // Evaluate Crash losses
  useEffect(() => {
     if (isCrashed && hasActiveBetThisRound && !hasCashedOut) {
         setWinStatus('lose');
         playSound('lose');
         setHasActiveBetThisRound(false);
     }
  }, [isCrashed, hasActiveBetThisRound, hasCashedOut]);

  const handlePlayCoin = async () => {
    if (!user) return;
    const amount = Number(betAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError(t('Enter a valid amount'));
      return;
    }
    
    if (amount > user.balance) {
      setError(t('Insufficient balance'));
      return;
    }

    setError('');
    setIsFlipping(true);
    playSound('flip');
    setResult(null);
    setWinStatus(null);

    // Initial bet deduction
    await store.updateUser(user.id, {
      balance: user.balance - amount
    });
    
    await store.addTransaction({
      userId: user.id,
      type: 'transfer',
      amount: -amount,
      status: 'completed',
      description: `Bet on Coin Flip (${choice})`
    });

    setTimeout(async () => {
      const state = store.getState();
      const winRate = state.gameCoinWinRate !== undefined ? state.gameCoinWinRate : 48;
      const isWin = Math.random() < (winRate / 100); 
      const flipResult = isWin ? choice : (choice === 'heads' ? 'tails' : 'heads');
      
      setResult(flipResult);
      setWinStatus(isWin ? 'win' : 'lose');
      if (isWin) playSound('win');
      else playSound('lose');
      setIsFlipping(false);

      if (isWin) {
        const winAmount = amount * 1.95; 
        const currentUser = store.getState().users.find(u => u.id === user.id);
        const currentBalance = currentUser ? currentUser.balance : user.balance;
        
        await store.updateUser(user.id, {
          balance: currentBalance + winAmount
        });
        
        await store.addTransaction({
          userId: user.id,
          type: 'reward' as any,
          amount: winAmount,
          status: 'completed',
          description: `Won Coin Flip (${flipResult})`
        });
      }
    }, 2000);
  };

  const handlePlayDice = async () => {
    if (!user) return;
    const amount = Number(betAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError(t('Enter a valid amount'));
      return;
    }
    
    if (amount > user.balance) {
      setError(t('Insufficient balance'));
      return;
    }

    setError('');
    setIsRolling(true);
    playSound('tick');
    setDiceResult(null);
    setWinStatus(null);

    // Initial bet deduction
    await store.updateUser(user.id, {
      balance: user.balance - amount
    });
    
    await store.addTransaction({
      userId: user.id,
      type: 'transfer',
      amount: -amount,
      status: 'completed',
      description: `Bet on Dice Roll (Under ${diceTarget})`
    });

    setTimeout(async () => {
      const state = store.getState();
      const winRateModifier = (state.gameDiceWinRate !== undefined ? state.gameDiceWinRate : 48) / 50; 
      // If winRate is 48, modifier is 0.96.
      
      const multiplier = 99 / diceTarget; // e.g. target 50 = 1.98x
      
      // Real win chance calculation (diceTarget - 1) is true odds, we apply modifier
      let isWin = Math.random() < ((diceTarget / 100) * winRateModifier);

      let finalRoll = 0;
      if (isWin) {
          finalRoll = Math.floor(Math.random() * diceTarget); // 0 to target-1
      } else {
          finalRoll = Math.floor(Math.random() * (100 - diceTarget)) + diceTarget; // target to 99
      }
      
      setDiceResult(finalRoll);
      setWinStatus(isWin ? 'win' : 'lose');
      if (isWin) playSound('win');
      else playSound('lose');
      setIsRolling(false);

      if (isWin) {
        const winAmount = amount * multiplier; 
        await store.updateUser(user.id, {
          balance: store.getState().users.find(u => u.id === user.id)!.balance + winAmount
        });
        
        await store.addTransaction({
          userId: user.id,
          type: 'reward' as any,
          amount: winAmount,
          status: 'completed',
          description: `Won Dice Roll (${finalRoll} < ${diceTarget})`
        });
      }
    }, 1500);
  };

  const handlePlaySlots = async () => {
    if (!user) return;
    const amount = Number(betAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError(t('Enter a valid amount'));
      return;
    }
    
    if (amount > user.balance) {
      setError(t('Insufficient balance'));
      return;
    }

    setError('');
    setIsSpinning(true);
    playSound('spin');
    setWinStatus(null);
    setSlotsWinMultipliers(0);
    // show random spinning state
    setSlotsResult([
      ['❓', '❓', '❓', '❓', '❓'],
      ['❓', '❓', '❓', '❓', '❓'],
      ['❓', '❓', '❓', '❓', '❓']
    ]);

    // Initial bet deduction
    await store.updateUser(user.id, {
      balance: user.balance - amount
    });
    
    await store.addTransaction({
      userId: user.id,
      type: 'transfer',
      amount: -amount,
      status: 'completed',
      description: `Bet on Mega Slots`
    });

    const state = store.getState();
    const winRate = state.gameSlotsWinRate !== undefined ? state.gameSlotsWinRate : 48;
    
    setTimeout(async () => {
      let isWin = false;
      let totalMultiplier = 0;
      let newGrid: string[][] = [
         [...Array(5)],
         [...Array(5)],
         [...Array(5)]
      ];

      const payouts: Record<string, number> = {
        '💎': 5.0,
        '💰': 2.0,
        '🤠': 1.0,
        '🐴': 0.8,
        '🔫': 0.5,
        '🍒': 0.3,
        'A': 0.2,
        'K': 0.1,
        'Q': 0.1,
        'J': 0.1
      };

      // Force Win/Loss based on WinRate to ensure house edge
      // If win rate is 48, there is a 48% chance this spin will generate combinations that pay > 0.
      const shouldWin = Math.random() < (winRate / 100);

      // Randomly populate grid
      for (let r=0; r<3; r++) {
         for (let c=0; c<5; c++) {
            newGrid[r][c] = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
         }
      }

      // Check ways. Megaways logic (simplistic): 3 or more from left to right
      const checkGridWays = (grid: string[][]) => {
         let mult = 0;
         for (const sym of slotSymbols) {
             let consecutive = 0;
             let ways = 1;
             for (let c = 0; c < 5; c++) {
                 let countInCol = 0;
                 for (let r = 0; r < 3; r++) {
                    if (grid[r][c] === sym) countInCol++;
                 }
                 if (countInCol > 0) {
                    consecutive++;
                    ways *= countInCol;
                 } else {
                    break;
                 }
             }
             if (consecutive >= 3) {
                 mult += payouts[sym] * ways * (consecutive - 2); // 3=1x, 4=2x, 5=3x
             }
         }
         return mult;
      };

      totalMultiplier = checkGridWays(newGrid);

      // Enforce the forced win/loss outcome. This is a simulation trick.
      let attempts = 0;
      while ((shouldWin && totalMultiplier === 0) || (!shouldWin && totalMultiplier > 0)) {
         if (attempts > 50) break; // Fallback to avoid infinite loops
         for (let r=0; r<3; r++) {
            for (let c=0; c<5; c++) {
               newGrid[r][c] = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
            }
         }
         totalMultiplier = checkGridWays(newGrid);
         attempts++;
      }

      // if still didn't match (unlikely, but possible), accept reality.
      isWin = totalMultiplier > 0;
      // Cap multiplier for safety in simulation
      totalMultiplier = Math.min(totalMultiplier, 500);

      setSlotsResult(newGrid);
      setSlotsWinMultipliers(totalMultiplier);
      setWinStatus(isWin ? 'win' : 'lose');
      if (isWin) playSound('win');
      else playSound('lose');
      setIsSpinning(false);

      if (isWin) {
        const winAmount = amount * totalMultiplier; 
        await store.updateUser(user.id, {
          balance: (store.getState().users.find(u => u.id === user.id)?.balance || user.balance) + winAmount
        });
        
        await store.addTransaction({
          userId: user.id,
          type: 'reward' as any,
          amount: winAmount,
          status: 'completed',
          description: `Won Mega Slots (${totalMultiplier.toFixed(2)}x)`
        });
      }
    }, 2000);
  };

  const handlePlayWheel = async () => {
    if (!user) return;
    const amount = Number(betAmount);
    if (isNaN(amount) || amount <= 0 || amount > user.balance) {
      setError(t('Invalid bet amount'));
      return;
    }

    setError('');
    setIsSpinningWheel(true);
    playSound('spin');
    setWinStatus(null);
    setWheelMultiplier(null);

    // Secure bet deduction now handled via store.updateUser wrapper
    await store.updateUser(user.id, {
      balance: user.balance - amount
    });
    
    await store.addTransaction({
      userId: user.id,
      type: 'bet' as any,
      amount: -amount,
      status: 'completed',
      description: `Bet on Spin Wheel`
    });

    const segments = [0, 1.5, 0, 2, 0, 1.2, 0, 5, 0, 1.1];

    setTimeout(async () => {
      // 30% win rate
      let isWin = Math.random() < 0.3;
      let finalMult = 0;
      let segmentIndex = 0;

      if (isWin) {
         const winSegments = segments.map((m, i) => m > 0 ? i : -1).filter(i => i !== -1);
         segmentIndex = winSegments[Math.floor(Math.random() * winSegments.length)];
      } else {
         const loseSegments = segments.map((m, i) => m === 0 ? i : -1).filter(i => i !== -1);
         segmentIndex = loseSegments[Math.floor(Math.random() * loseSegments.length)];
      }
      finalMult = segments[segmentIndex];
      isWin = finalMult > 0;

      // Calculate rotation
      const sliceAngle = 360 / segments.length;
      // Add extra spins + land on segment
      const targetRotation = wheelRotation + (360 * 5) + (segmentIndex * sliceAngle) + (sliceAngle / 2);

      setWheelRotation(targetRotation);
      setWheelMultiplier(finalMult);
      setWinStatus(isWin ? 'win' : 'lose');
      if (isWin) playSound('win');
      else playSound('lose');
      setIsSpinningWheel(false);

      if (isWin) {
        const winAmount = amount * finalMult; 
        const currentUser = store.getState().users.find(u => u.id === user.id);
        const currentBalance = currentUser ? currentUser.balance : user.balance;
        
        await store.updateUser(user.id, {
          balance: currentBalance + winAmount
        });
        
        await store.addTransaction({
          userId: user.id,
          type: 'reward' as any,
          amount: winAmount,
          status: 'completed',
          description: `Won Spin Wheel (${finalMult.toFixed(2)}x)`
        });
      }
    }, 4000); // 4 seconds spinning
  };

  const state = store.getState();
  const showCoinFlip = state.gameCoinFlipEnabled !== false;
  const showDiceRoll = state.gameDiceRollEnabled !== false;
  const showCrash = state.gameCrashEnabled !== false;
  const showSlots = state.gameSlotsEnabled !== false;
  const showFish = state.gameFishEnabled !== false;
  const showWheel = state.gameWheelEnabled !== false;
  const showMines = state.gameMinesEnabled !== false;
  const showPlinko = state.gamePlinkoEnabled !== false;
  const showTower = state.gameTowerEnabled !== false;

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-white p-4 pb-4 font-sans">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-[var(--color-bg-card)] rounded-xl text-text-muted hover:text-white border border-[var(--color-border-card)]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{t('Games')}</h1>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-3xl p-6 mb-6 text-center">
        <h2 className="text-text-muted text-sm mb-1">{t('Total Balance')}</h2>
        <div className="text-3xl font-bold font-mono text-brand-gold flex justify-center items-center gap-2">
          {user?.balance.toFixed(2)} XRP
        </div>
      </div>

      {activeTab !== 'lobby' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none items-center">
          <button
            onClick={() => setActiveTab('lobby')}
            className="flex-none p-3 rounded-xl font-bold transition-all bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)] hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          {showCrash && (
            <button
              onClick={() => { setActiveTab('crash'); setError(''); }}
              className={`flex-none px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'crash' ? 'bg-brand-primary text-black' : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'}`}
            >
            {t('Crazy Worm')}
            </button>
          )}
          {showCrash && (
            <button
            onClick={() => { setActiveTab('rocket'); setError(''); }}
            className={`flex-none px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'rocket' ? 'bg-brand-primary text-black' : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'}`}
            >
            {t('Crash Rocket')}
            </button>
          )}
          {showCoinFlip && (
            <button
            onClick={() => { setActiveTab('coin'); setError(''); }}
            className={`flex-none px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'coin' ? 'bg-brand-primary text-black' : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'}`}
            >
            {t('Coin Flip')}
            </button>
          )}
          {showDiceRoll && (
            <button
            onClick={() => { setActiveTab('dice'); setError(''); }}
            className={`flex-none px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'dice' ? 'bg-brand-primary text-black' : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'}`}
            >
            {t('Dice Roll')}
            </button>
          )}
          {showSlots && (
            <button
            onClick={() => { setActiveTab('slots'); setError(''); }}
            className={`flex-none px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'slots' ? 'bg-brand-primary text-black' : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'}`}
            >
            {t('Slots')}
            </button>
          )}
          {showWheel && (
            <button
            onClick={() => { setActiveTab('wheel'); setError(''); }}
            className={`flex-none px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'wheel' ? 'bg-brand-primary text-black' : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'}`}
            >
            {t('Spin Wheel')}
            </button>
          )}
          {showFish && (
            <button
            onClick={() => { setActiveTab('fish'); setError(''); }}
            className={`flex-none px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'fish' ? 'bg-brand-primary text-black' : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'}`}
            >
            {t('Fish')}
            </button>
          )}
          {showMines && (
            <button
            onClick={() => { setActiveTab('mines'); setError(''); }}
            className={`flex-none px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'mines' ? 'bg-brand-primary text-black' : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'}`}
            >
            {t('Mines')}
            </button>
          )}
          {showPlinko && (
            <button
            onClick={() => { setActiveTab('plinko'); setError(''); }}
            className={`flex-none px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'plinko' ? 'bg-brand-primary text-black' : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'}`}
            >
            {t('Plinko')}
            </button>
          )}
          {showTower && (
            <button
            onClick={() => { setActiveTab('tower'); setError(''); }}
            className={`flex-none px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'tower' ? 'bg-brand-primary text-black' : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'}`}
            >
            {t('Tower')}
            </button>
          )}
        </div>
      )}

      {activeTab === 'lobby' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {showFish && (
            <div 
              onClick={() => setActiveTab('fish')} 
              className="cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-400 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 <span className="text-6xl drop-shadow-xl mb-4 transform group-hover:scale-110 transition-transform">🐟</span>
                 <span className="font-black text-xl text-white tracking-wide uppercase drop-shadow-lg text-center">{t('Fishing')}</span>
              </div>
              <div className="absolute bottom-3 right-3 opacity-50"><Trophy size={16} /></div>
            </div>
          )}

          {showCrash && (
            <div 
              onClick={() => setActiveTab('rocket')} 
              className="cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-pink-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 <span className="text-6xl drop-shadow-xl mb-4 transform group-hover:scale-110 transition-transform">🚀</span>
                 <span className="font-black text-xl text-white tracking-wide uppercase drop-shadow-lg text-center">{t('Crash Rocket')}</span>
              </div>
            </div>
          )}

          {showCrash && (
            <div 
              onClick={() => setActiveTab('crash')} 
              className="cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 <span className="text-6xl drop-shadow-xl mb-4 transform group-hover:scale-110 transition-transform">🐛</span>
                 <span className="font-black text-xl text-white tracking-wide uppercase drop-shadow-lg text-center">{t('Crazy Worm')}</span>
              </div>
            </div>
          )}

          {showSlots && (
            <div 
              onClick={() => setActiveTab('slots')} 
              className="cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 <span className="text-6xl drop-shadow-xl mb-4 transform group-hover:scale-110 transition-transform">🎰</span>
                 <span className="font-black text-xl text-white tracking-wide uppercase drop-shadow-lg text-center">{t('Slots')}</span>
              </div>
            </div>
          )}

          {showCoinFlip && (
            <div 
              onClick={() => setActiveTab('coin')} 
              className="cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 to-orange-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620327663459-009f42d54e43?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 <span className="text-6xl drop-shadow-xl mb-4 transform group-hover:scale-110 transition-transform">🪙</span>
                 <span className="font-black text-xl text-white tracking-wide uppercase drop-shadow-lg text-center">{t('Coin Flip')}</span>
              </div>
            </div>
          )}

          {showDiceRoll && (
            <div 
              onClick={() => setActiveTab('dice')} 
              className="cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-rose-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570303345338-e1f0eddf4946?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 <span className="text-6xl drop-shadow-xl mb-4 transform group-hover:scale-110 transition-transform">🎲</span>
                 <span className="font-black text-xl text-white tracking-wide uppercase drop-shadow-lg text-center">{t('Roll Dice')}</span>
              </div>
            </div>
          )}

          {showWheel && (
            <div 
              onClick={() => setActiveTab('wheel')} 
              className="cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 <span className="text-6xl drop-shadow-xl mb-4 transform group-hover:scale-110 transition-transform">🎡</span>
                 <span className="font-black text-xl text-white tracking-wide uppercase drop-shadow-lg text-center">{t('Spin Wheel')}</span>
              </div>
            </div>
          )}

          {showMines && (
            <div 
              onClick={() => setActiveTab('mines')} 
              className="cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-gray-900 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 <span className="text-6xl drop-shadow-xl mb-4 transform group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">💣</span>
                 <span className="font-black text-xl text-white tracking-wide uppercase drop-shadow-lg text-center">{t('Mines')}</span>
              </div>
            </div>
          )}

          {showPlinko && (
            <div 
              onClick={() => setActiveTab('plinko')} 
              className="cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600 to-rose-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 <span className="text-6xl drop-shadow-xl mb-4 transform group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(255,192,203,0.8)]">🟣</span>
                 <span className="font-black text-xl text-white tracking-wide uppercase drop-shadow-lg text-center">{t('Plinko')}</span>
              </div>
            </div>
          )}

          {showTower && (
            <div 
              onClick={() => setActiveTab('tower')} 
              className="cursor-pointer rounded-2xl overflow-hidden relative group aspect-[3/4]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-yellow-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502003148287-a82ef80a6abc?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 <span className="text-6xl drop-shadow-xl mb-4 transform group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">🗼</span>
                 <span className="font-black text-xl text-white tracking-wide uppercase drop-shadow-lg text-center">{t('Tower')}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
      <div className="relative">
        {((activeTab === 'coin' && !showCoinFlip) ||
          (activeTab === 'dice' && !showDiceRoll) ||
          ((activeTab === 'crash' || activeTab === 'rocket') && !showCrash) ||
          (activeTab === 'slots' && !showSlots) ||
          (activeTab === 'wheel' && !showWheel) ||
          (activeTab === 'fish' && !showFish) ||
          (activeTab === 'mines' && !showMines) ||
          (activeTab === 'plinko' && !showPlinko) ||
          (activeTab === 'tower' && !showTower)) && (
          <div className="absolute inset-0 z-50 bg-[var(--color-bg-base)]/80 flex flex-col items-center justify-center backdrop-blur-md rounded-3xl p-4">
            <div className="bg-[var(--color-bg-card)] border border-red-500/50 p-6 rounded-2xl text-center shadow-xl">
              <h3 className="text-xl font-bold text-red-500 mb-2">Game Maintenance</h3>
              <p className="text-text-muted">This game is currently disabled by the administrator.</p>
            </div>
          </div>
        )}
        <div className={((activeTab === 'coin' && !showCoinFlip) || (activeTab === 'dice' && !showDiceRoll) || ((activeTab === 'crash' || activeTab === 'rocket') && !showCrash) || (activeTab === 'slots' && !showSlots) || (activeTab === 'wheel' && !showWheel) || (activeTab === 'fish' && !showFish) || (activeTab === 'mines' && !showMines) || (activeTab === 'plinko' && !showPlinko) || (activeTab === 'tower' && !showTower)) ? 'opacity-50 pointer-events-none' : ''}>
          {activeTab === 'coin' ? (
        <>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-3xl p-6 mb-6">
            <div className="flex justify-center mb-8 relative h-32 w-full perspective-1000">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key="coin"
                  animate={{ 
                    rotateY: isFlipping ? [0, 360, 720, 1080, 1440] : result === 'heads' ? 0 : result === 'tails' ? 180 : 0,
                    y: isFlipping ? [0, -100, 0] : 0
                  }}
                  transition={{ 
                    duration: isFlipping ? 2 : 0.5, 
                    ease: "easeInOut",
                    times: isFlipping ? [0, 0.5, 1] : undefined
                  }}
                  className="absolute w-32 h-32 rounded-full flex items-center justify-center border-4 border-brand-gold bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_30px_rgba(255,215,0,0.4)] perspective-coin"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {!isFlipping && result === 'tails' ? (
                    <div className="absolute font-bold text-3xl text-black drop-shadow-md transform rotate-y-180">
                      TAILS
                    </div>
                  ) : (
                    <div className="absolute font-bold text-3xl text-black drop-shadow-md">
                      HEADS
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {winStatus && !isFlipping && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className={`text-center font-bold text-2xl mb-6 ${winStatus === 'win' ? 'text-green-500' : 'text-red-500'}`}
              >
                {winStatus === 'win' ? t('You Won!') : t('You Lost!')}
              </motion.div>
            )}

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-text-muted px-1 mb-2 block">
                  {t('Bet Amount (XRP)')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    disabled={isFlipping || isRolling}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary font-mono text-lg font-bold"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                    <button 
                      onClick={() => setBetAmount((user?.balance || 0).toString())}
                      disabled={isFlipping || isRolling}
                      className="px-3 py-1.5 bg-brand-gold/10 text-brand-gold rounded-lg text-sm font-bold active:scale-95 transition-transform"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-text-muted px-1 mb-2 block">{t('I predict')}</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    disabled={isFlipping}
                    onClick={() => setChoice('heads')}
                    className={`py-4 rounded-2xl font-bold text-lg border-2 transition-all ${choice === 'heads' ? 'border-brand-gold bg-brand-gold/20 text-brand-gold' : 'border-[var(--color-border-card)] bg-[var(--color-bg-base)] text-text-muted hover:border-brand-gold/50'}`}
                  >
                    Heads
                  </button>
                  <button
                    disabled={isFlipping}
                    onClick={() => setChoice('tails')}
                    className={`py-4 rounded-2xl font-bold text-lg border-2 transition-all ${choice === 'tails' ? 'border-brand-gold bg-brand-gold/20 text-brand-gold' : 'border-[var(--color-border-card)] bg-[var(--color-bg-base)] text-text-muted hover:border-brand-gold/50'}`}
                  >
                    Tails
                  </button>
                </div>
              </div>

              <button
                onClick={handlePlayCoin}
                disabled={isFlipping}
                className="w-full bg-gradient-to-r from-brand-primary to-brand-gold text-black font-bold py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,90,0,0.3)] text-xl tracking-wide disabled:opacity-50 disabled:active:scale-100"
              >
                {isFlipping ? t('Flipping...') : t('FLIP COIN')}
              </button>
            </div>
          </div>
          
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] p-4 rounded-2xl text-sm text-text-muted">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2"><RefreshCw size={16}/> {t('How to play')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('Enter your bet amount in XRP')}</li>
              <li>{t('Select Heads or Tails')}</li>
              <li>{t('If you guess correctly, you win 1.95x your bet!')}</li>
            </ul>
          </div>
        </>
      ) : activeTab === 'dice' ? (
        <>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-3xl p-6 mb-6">
            <div className="flex justify-center flex-col items-center mb-8 relative w-full pt-4">
               <div className="text-6xl font-bold font-mono text-brand-primary mb-2 shadow-[0_0_30px_rgba(0,240,255,0.4)] px-8 py-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/30">
                 {isRolling ? '...' : (diceResult !== null ? diceResult : '00')}
               </div>
               <div className="text-sm text-text-muted mt-2">Target: Under {diceTarget}</div>
            </div>

            {winStatus && !isRolling && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className={`text-center font-bold text-2xl mb-6 ${winStatus === 'win' ? 'text-green-500' : 'text-red-500'}`}
              >
                {winStatus === 'win' ? t('You Won!') : t('You Lost!')}
              </motion.div>
            )}

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-text-muted px-1 mb-2 block">
                  {t('Bet Amount (XRP)')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    disabled={isFlipping || isRolling}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary font-mono text-lg font-bold"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                    <button 
                      onClick={() => setBetAmount((user?.balance || 0).toString())}
                      disabled={isFlipping || isRolling}
                      className="px-3 py-1.5 bg-[#00FFFF]/10 text-brand-primary border border-brand-primary/30 rounded-lg text-sm font-bold active:scale-95 transition-transform"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-text-muted px-1 mb-2 flex justify-between">
                  <span>{t('Target Roll (Under)')}</span>
                  <span className="text-brand-primary font-bold">{diceTarget}</span>
                </label>
                <div className="bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl p-4">
                  <input
                    type="range"
                    min="5"
                    max="95"
                    disabled={isRolling}
                    value={diceTarget}
                    onChange={(e) => setDiceTarget(parseInt(e.target.value))}
                    className="w-full h-2 bg-[var(--color-border-card)] rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <div className="flex justify-between mt-2 text-xs text-text-muted font-mono">
                    <span>Win Chance: {diceTarget-1}%</span>
                    <span>Payout: {(99/diceTarget).toFixed(2)}x</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlayDice}
                disabled={isRolling}
                className="w-full bg-gradient-to-r from-[#00FFFF] to-[#0088FF] text-black font-bold py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] text-xl tracking-wide disabled:opacity-50 disabled:active:scale-100"
              >
                {isRolling ? t('Rolling...') : t('ROLL DICE')}
              </button>
            </div>
          </div>
          
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] p-4 rounded-2xl text-sm text-text-muted">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2"><RefreshCw size={16}/> {t('How to play')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('Enter bet amount and set target number (5-95)')}</li>
              <li>{t('Click ROLL DICE to generate a number 0-99')}</li>
              <li>{t('If the roll is under your target, you win the payout multiplier!')}</li>
            </ul>
          </div>
        </>
      ) : (activeTab === 'crash' || activeTab === 'rocket') ? (
        <div className="bg-[#050b1a] rounded-3xl p-4 md:p-6 mb-6 text-white overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            
            {crashHistory.length > 0 && (
                <div className="flex gap-2 overflow-x-auto mb-4 pb-2 scrollbar-none items-center">
                    <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">Round ID</span>
                    <div className="flex-1"></div>
                    {crashHistory.map((h, i) => (
                        <span key={i} className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${h >= 2 ? 'bg-[#154625] text-[#34d399]' : 'bg-[#3b1717] text-[#f87171]'} shadow-sm`}>
                            {h.toFixed(2)}x
                        </span>
                    ))}
                </div>
            )}

            <div className="flex justify-center items-center mb-6 relative">
              <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-600 bg-clip-text text-transparent italic absolute top-0 text-center uppercase tracking-wider drop-shadow-[0_0_15px_rgba(255,0,255,0.8)]">
                  {activeTab === 'rocket' ? 'Crash Rocket' : 'Crazy Worm'}
              </h2>
            </div>

            <div className={`relative w-full h-[160px] sm:h-[250px] rounded-2xl border overflow-hidden mb-4 sm:mb-8 flex flex-col items-center justify-center mt-4 sm:mt-8 ${activeTab === 'rocket' ? 'bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] border-[#4a4e69]' : 'bg-gradient-to-b from-[#1a0b0b] to-[#0a1f0a] border-[#1b4332]'}`}>
               
               {/* Background distinct pattern */}
               <div className={`absolute inset-0 opacity-10 ${activeTab === 'rocket' ? '' : 'opacity-20'}`} style={activeTab === 'rocket' ? { backgroundImage: 'repeating-conic-gradient(from 0deg, transparent 0deg 10deg, #ffffff 10deg 20deg)' } : { backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

               {/* SVG Curve Canvas for Aviator look */}
               {(isCrashFlying || isCrashed) && (
                 <div className="absolute inset-0">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={activeTab === 'rocket' ? '#f43f5e' : '#10b981'} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={activeTab === 'rocket' ? '#f43f5e' : '#10b981'} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* 
                           Calculate virtual position:
                           X grows up to ~90% of screen.
                           Y grows up to ~90% of screen.
                        */}
                        <path 
                          d={`M 0,100 Q ${Math.min(90, 10 + (crashMultiplier - 1) * 4) / 2},100 ${Math.min(90, 10 + (crashMultiplier - 1) * 4)},${100 - Math.min(80, 10 + (crashMultiplier - 1) * 6)} L ${Math.min(90, 10 + (crashMultiplier - 1) * 4)},100 Z`}
                          fill="url(#curveGrad)" 
                          className={isCrashed ? 'opacity-0 transition-opacity duration-300' : 'opacity-100'}
                        />
                        <path 
                          d={`M 0,100 Q ${Math.min(90, 10 + (crashMultiplier - 1) * 4) / 2},100 ${Math.min(90, 10 + (crashMultiplier - 1) * 4)},${100 - Math.min(80, 10 + (crashMultiplier - 1) * 6)}`}
                          stroke={activeTab === 'rocket' ? '#f43f5e' : '#10b981'} 
                          strokeWidth="3" 
                          fill="none" 
                          className={isCrashed ? 'opacity-0 transition-opacity duration-300' : 'opacity-100'}
                        />
                    </svg>
                 </div>
               )}

               {!isCrashFlying && !isCrashed ? (
                 <div className="text-4xl md:text-6xl font-sans font-black z-10 text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.8)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 uppercase tracking-tight text-center">
                   <div className="text-sm md:text-2xl mb-2 text-white font-normal animate-pulse tracking-widest uppercase">Next Round In</div>
                   <div className="flex items-center justify-center gap-1">
                      <span className="text-6xl md:text-8xl">{Math.floor(crashTimeToStart / 1000)}</span>
                      <span className="text-3xl md:text-5xl opacity-80 mt-4">s</span>
                   </div>
                 </div>
               ) : (
                 <div className={`text-6xl md:text-8xl font-sans font-black z-10 transition-colors tracking-tighter absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isCrashed ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]' : hasCashedOut ? 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]' : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]'}`}>
                   {crashMultiplier.toFixed(2)}x
                 </div>
               )}
               
               {isCrashed && (
                   <div className="absolute top-[20%] text-red-500 font-bold z-10 text-xl md:text-2xl tracking-widest uppercase animate-pulse border-2 border-red-500 bg-red-500/20 px-6 py-2 rounded-xl backdrop-blur-sm">Crashed</div>
               )}

               {hasCashedOut && (
                   <div className="absolute top-[70%] z-10 text-green-400 font-bold bg-[#154625] px-6 py-2 rounded-full border border-green-500/50 flex flex-col items-center">
                       WON {(cashedOutAmount).toFixed(2)}
                   </div>
               )}

               {/* Stylized Animation Character */}
               <div 
                 className="absolute z-20 ease-linear pointer-events-none origin-center"
                 style={{
                   transitionDuration: isCrashFlying && !isCrashed ? '100ms' : isCrashed ? '0ms' : '0ms',
                   bottom: isCrashFlying && !isCrashed 
                      ? `${Math.min(80, 10 + (crashMultiplier - 1) * 6)}%` 
                      : isCrashed ? '-20%' : '10%',
                   left: isCrashFlying && !isCrashed 
                      ? `${Math.min(90, 10 + (crashMultiplier - 1) * 4)}%` 
                      : isCrashed ? '50%' : '10%',
                   transform: `translate(-50%, 50%) rotate(${isCrashFlying && !isCrashed ? -15 : isCrashed ? 90 : 0}deg) ${activeTab === 'crash' ? 'scaleX(-1)' : ''}`,
                   opacity: isCrashed ? 0 : 1
                 }}
               >
                  <span className={`text-4xl lg:text-5xl inline-block ${activeTab === 'rocket' ? 'drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]'}`}>
                     {activeTab === 'rocket' ? '🚀' : '🐛'}
                  </span>
               </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-400 px-2">
                 <span>Odd (x1.01 - x10,000)</span>
              </div>
              <div className="flex gap-2 sm:gap-4 flex-col sm:flex-row">
                  <div className="flex items-center flex-1 bg-[#101b33] rounded-full p-1 border border-[#1e345e]">
                     <button className="w-8 h-8 rounded-full bg-[#182848] text-white flex items-center justify-center font-bold" onClick={() => setTargetOdd((Math.max(1.01, parseFloat(targetOdd) - 0.1)).toFixed(2))}>-</button>
                     <input 
                       type="number"
                       className="flex-1 bg-transparent text-center text-white font-bold outline-none"
                       value={targetOdd}
                       onChange={(e) => setTargetOdd(e.target.value)}
                       step="0.01"
                       min="1.01"
                     />
                     <button className="w-8 h-8 rounded-full bg-[#182848] text-white flex items-center justify-center font-bold" onClick={() => setTargetOdd((parseFloat(targetOdd) + 0.1).toFixed(2))}>+</button>
                  </div>
              </div>

              <div className="flex gap-2 md:gap-4 items-center justify-between pt-2 flex-wrap">
                  <div className="flex gap-2">
                     <button 
                       onClick={() => setCrashAutoRound(prev => prev === 10 ? 50 : prev === 50 ? 100 : 10)}
                       className="px-3 md:px-4 py-2 bg-[#1d3557] text-[#48cae4] rounded-full font-bold text-xs flex items-center gap-1 border border-[#48cae4]/30 hover:bg-[#48cae4]/20 transition-colors"
                     >
                        <Coins size={14} /> {crashAutoRound}
                     </button>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => setAutoBetEnabled(prev => !prev)}
                       className={`px-3 md:px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 border transition-colors ${autoBetEnabled ? 'bg-[#3b82f6] text-white border-blue-400' : 'bg-[#1d3557] text-white border-[#3b82f6]/30'}`}
                     >
                        {autoBetEnabled ? 'ON' : 'OFF'} <RefreshCw size={14} className={autoBetEnabled ? 'text-white' : 'text-[#3b82f6]'} />
                     </button>
                     <button 
                       onClick={() => setTurboEnabled(prev => !prev)}
                       className={`px-3 md:px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 border transition-colors ${turboEnabled ? 'bg-[#f59e0b] text-white border-yellow-400' : 'bg-[#1d3557] text-white border-[#3b82f6]/30'}`}
                     >
                        Turbo <Rocket size={14} className={turboEnabled ? 'text-white' : 'text-[#f59e0b]'} />
                     </button>
                  </div>
              </div>

              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

              <div className="flex gap-2 lg:gap-4 mt-6 items-center flex-col sm:flex-row">
                 <div className="w-full sm:w-auto flex-1 bg-[#101b33] rounded-2xl p-2 border border-[#1e345e]">
                     <div className="flex gap-2 items-center">
                         <button 
                           onClick={() => setBetAmount(String(Math.max(1, parseFloat(betAmount) / 2)))}
                           disabled={isCrashFlying && !isCrashed}
                           className="w-10 h-10 shrink-0 rounded-full bg-[#182848] text-white font-bold flex items-center justify-center hover:bg-[#20365e] transition-colors disabled:opacity-50"
                         >
                            -
                         </button>
                         <input 
                           type="number"
                           className="flex-1 w-20 bg-transparent text-center text-white font-bold outline-none text-lg"
                           value={betAmount}
                           onChange={(e) => setBetAmount(e.target.value)}
                           disabled={isCrashFlying && !isCrashed}
                           min="1"
                         />
                         <button 
                           onClick={() => setBetAmount(String(parseFloat(betAmount) * 2))}
                           disabled={isCrashFlying && !isCrashed}
                           className="w-10 h-10 shrink-0 rounded-full bg-[#182848] text-white font-bold flex items-center justify-center hover:bg-[#20365e] transition-colors disabled:opacity-50"
                         >
                            +
                         </button>
                     </div>
                 </div>
                 
                 {hasActiveBetThisRound && !isCrashFlying && !isCrashed ? (
                      <button
                        disabled
                        className="w-full sm:flex-1 h-20 bg-[#d9534f] text-white font-black rounded-2xl opacity-50 text-xl tracking-wide flex flex-col items-center justify-center border-b-4 border-[#c9302c] grayscale"
                      >
                        <span className="uppercase text-lg">Waiting for Flight...</span>
                      </button>
                 ) : isCrashed ? (
                      <button
                        disabled
                        className="w-full sm:flex-1 h-20 bg-[#28a745] text-white font-black rounded-2xl opacity-50 text-xl md:text-2xl tracking-wide flex flex-col items-center justify-center border-b-4 border-[#1e7e34] grayscale"
                      >
                        <span className="uppercase text-lg">Bet Next Round</span>
                        <span className="text-xl font-bold">{parseFloat(betAmount).toFixed(2)} XRP</span>
                     </button>
                 ) : !isCrashFlying && !hasActiveBetThisRound ? (
                     <button
                        ref={crashBetBtnRef}
                        onClick={handlePlayCrash}
                        className="w-full sm:flex-1 h-20 bg-[#28a745] text-white font-black rounded-2xl hover:bg-[#218838] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(40,167,69,0.3)] text-xl md:text-2xl tracking-wide flex flex-col items-center justify-center border-b-4 border-[#1e7e34]"
                      >
                        <span className="uppercase text-lg">Bet</span>
                        <span className="text-xl font-bold">{parseFloat(betAmount).toFixed(2)} XRP</span>
                     </button>
                  ) : hasCashedOut || !hasActiveBetThisRound ? (
                      <button
                        disabled
                        className="w-full sm:flex-1 h-20 bg-[#d9534f] text-white font-black rounded-2xl opacity-50 text-xl tracking-wide flex flex-col items-center justify-center border-b-4 border-[#c9302c] grayscale"
                      >
                        <span className="uppercase text-lg">Wait for Next</span>
                        {hasCashedOut && <span className="text-sm">You won {(cashedOutAmount).toFixed(2)}</span>}
                      </button>
                  ) : (
                      <button
                        onClick={handleCashoutCrash}
                        disabled={hasCashedOut}
                        className="w-full sm:flex-1 h-20 bg-[#ff9900] text-white font-black rounded-2xl hover:bg-[#e68a00] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(255,153,0,0.3)] text-xl tracking-wide flex flex-col items-center justify-center border-b-4 border-[#cc7a00]"
                      >
                        <span className="uppercase text-lg">Cash Out</span>
                        <span className="text-xl font-bold">{(activeBetAmount * crashMultiplier).toFixed(2)} XRP</span>
                      </button>
                  )}
              </div>

              <div className="flex justify-between items-center text-xs text-white pt-4 md:px-4">
                 <span className="font-bold flex gap-1">Balance: <span className="text-brand-gold">{user?.balance.toFixed(2)} XRP</span></span>
                 <span className="font-bold">Last Win: {hasCashedOut ? `${(cashedOutAmount).toFixed(2)} XRP` : '-'}</span>
              </div>
            </div>
        </div>
      ) : activeTab === 'slots' ? (
        <>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-3xl p-6 mb-6">
            <div className="flex justify-center mb-8 relative w-full pt-4">
               <div className="flex flex-col gap-2 bg-black/40 p-4 rounded-xl border-4 border-[#FF007A]/50 overflow-hidden shadow-[0_0_30px_rgba(255,0,122,0.2)]">
                 {slotsResult.map((row, r) => (
                    <div key={r} className="flex gap-2 justify-center">
                     {row.map((sym, c) => (
                        <motion.div 
                            key={`${r}-${c}`}
                            animate={isSpinning ? { y: [0, -40, 40, 0] } : { y: 0 }}
                            transition={{ 
                                duration: 0.15, 
                                repeat: isSpinning ? Infinity : 0, 
                                ease: "linear",
                                delay: c * 0.1 // columns spin with delay
                            }}
                            className="w-12 h-16 md:w-16 md:h-20 bg-[var(--color-bg-base)] border border-[#FF007A]/30 rounded-lg flex items-center justify-center text-3xl shadow-inner text-white"
                        >
                            {sym}
                        </motion.div>
                     ))}
                    </div>
                 ))}
               </div>
            </div>

            {winStatus && !isSpinning && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className={`text-center font-bold text-2xl mb-6 ${winStatus === 'win' ? 'text-green-500' : 'text-red-500'}`}
              >
                {winStatus === 'win' ? `${t('You Won!')} +${slotsWinMultipliers.toFixed(2)}x` : t('You Lost!')}
              </motion.div>
            )}

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-text-muted px-1 mb-2 block">
                  {t('Bet Amount (XRP)')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    disabled={isSpinning}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary font-mono text-lg font-bold"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                    <button 
                      onClick={() => setBetAmount((user?.balance || 0).toString())}
                      disabled={isSpinning}
                      className="px-3 py-1.5 bg-[#FF007A]/10 text-[#FF007A] border border-[#FF007A]/30 rounded-lg text-sm font-bold active:scale-95 transition-transform"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>

              <button
                onClick={handlePlaySlots}
                disabled={isSpinning}
                className="w-full bg-gradient-to-r from-[#FF007A] to-[#FF8A00] text-white font-bold py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,0,122,0.4)] text-xl tracking-wide uppercase disabled:opacity-50 disabled:active:scale-100"
              >
                {isSpinning ? t('Spinning...') : t('SPIN')}
              </button>
            </div>
          </div>
          
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] p-4 rounded-2xl text-sm text-text-muted">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2"><RefreshCw size={16}/> {t('How to play')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('Enter bet amount and Spin')}</li>
              <li>{t('Match any 3 or more symbols from left to right to win')}</li>
              <li>{t('More consecutive symbols and high-value symbols pay bigger multipliers')}</li>
            </ul>
          </div>
        </>
      ) : activeTab === 'fish' ? (
        <>
            <div className="mb-4">
                <label className="text-sm font-medium text-text-muted px-1 mb-2 block">
                  {t('Bullet Cost (Bet Amount)')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary font-mono text-lg font-bold"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            
            <FishGame betAmount={betAmount} onError={setError} />

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] p-4 rounded-2xl text-sm text-text-muted mt-6">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><RefreshCw size={16}/> {t('How to play')}</h3>
                <ul className="list-disc pl-5 space-y-1">
                <li>{t('Adjust your bullet cost (bet amount) above.')}</li>
                <li>{t('Click on the screen to shoot bullets at the fish.')}</li>
                <li>{t('Each shot deducts your bullet cost instantly.')}</li>
                <li>{t('If you catch a fish, you win your bullet cost multiplied by the fish multiplier!')}</li>
                </ul>
            </div>
        </>
      ) : activeTab === 'wheel' ? (
        <>
            <div className="bg-[#050b1a] rounded-3xl p-6 mb-6 flex flex-col items-center shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#1e293b]">
              <div className="relative w-72 h-72 mx-auto mb-10">
                {/* Outer Glow */}
                <div className="absolute inset-[-10px] rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 blur-md opacity-30"></div>
                
                {/* Wheel pointer */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-white z-20 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                
                {/* Wheel SVG Component */}
                <motion.div 
                  className="w-full h-full relative"
                  animate={{ rotate: wheelRotation }}
                  transition={isSpinningWheel ? { duration: 4, ease: [0.1, 0.8, 0.1, 1] } : { duration: 0 }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                    <circle cx="50" cy="50" r="50" fill="#0f172a" />
                    <circle cx="50" cy="50" r="48" fill="none" stroke="#1e293b" strokeWidth="4" />
                    {/* Segment 0: 0x */}
                    <path d="M50 50 L50 2 A48 48 0 0 1 78.2 9.6 Z" fill="#1e293b" />
                    <text x="64" y="24" fill="#64748b" fontSize="6" fontWeight="bold" transform="rotate(18 50 50)">0x</text>
                    {/* Segment 1: 1.5x */}
                    <path d="M50 50 L78.2 9.6 A48 48 0 0 1 95.6 35 Z" fill="#3b82f6" />
                    <text x="82" y="44" fill="#ffffff" fontSize="6" fontWeight="bold" transform="rotate(54 50 50)">1.5x</text>
                    {/* Segment 2: 0x */}
                    <path d="M50 50 L95.6 35 A48 48 0 0 1 95.6 65 Z" fill="#1e293b" />
                    <text x="82" y="60" fill="#64748b" fontSize="6" fontWeight="bold" transform="rotate(90 50 50)">0x</text>
                    {/* Segment 3: 2x */}
                    <path d="M50 50 L95.6 65 A48 48 0 0 1 78.2 90.4 Z" fill="#10b981" />
                    <text x="64" y="80" fill="#ffffff" fontSize="6" fontWeight="bold" transform="rotate(126 50 50)">2x</text>
                    {/* Segment 4: 0x */}
                    <path d="M50 50 L78.2 90.4 A48 48 0 0 1 50 98 Z" fill="#1e293b" />
                    <text x="36" y="80" fill="#64748b" fontSize="6" fontWeight="bold" transform="rotate(162 50 50)">0x</text>
                    {/* Segment 5: 1.2x */}
                    <path d="M50 50 L50 98 A48 48 0 0 1 21.8 90.4 Z" fill="#f59e0b" />
                    <text x="18" y="60" fill="#ffffff" fontSize="6" fontWeight="bold" transform="rotate(198 50 50)">1.2x</text>
                    {/* Segment 6: 0x */}
                    <path d="M50 50 L21.8 90.4 A48 48 0 0 1 4.4 65 Z" fill="#1e293b" />
                    <text x="18" y="44" fill="#64748b" fontSize="6" fontWeight="bold" transform="rotate(234 50 50)">0x</text>
                    {/* Segment 7: 5x */}
                    <path d="M50 50 L4.4 65 A48 48 0 0 1 4.4 35 Z" fill="#8b5cf6" />
                    <text x="36" y="24" fill="#ffffff" fontSize="6" fontWeight="bold" transform="rotate(270 50 50)">5x</text>
                    {/* Segment 8: 0x */}
                    <path d="M50 50 L4.4 35 A48 48 0 0 1 21.8 9.6 Z" fill="#1e293b" />
                    <text x="64" y="24" fill="#64748b" fontSize="6" fontWeight="bold" transform="rotate(306 50 50)">0x</text>
                    {/* Segment 9: 1.1x */}
                    <path d="M50 50 L21.8 9.6 A48 48 0 0 1 50 2 Z" fill="#ec4899" />
                    <text x="82" y="44" fill="#ffffff" fontSize="6" fontWeight="bold" transform="rotate(342 50 50)">1.1x</text>
                    
                    {/* Inner circle */}
                    <circle cx="50" cy="50" r="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                    <circle cx="50" cy="50" r="4" fill="#ffffff" />
                  </svg>
                </motion.div>
              </div>

              {winStatus && (
                <motion.div 
                  initial={{ scale: 0, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  className={`text-3xl font-black mb-4 uppercase tracking-widest ${winStatus === 'win' ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]' : 'text-red-500'}`}
                >
                  {winStatus === 'win' ? `${t('You Won!')} +${wheelMultiplier?.toFixed(2)}x` : t('You Lost!')}
                </motion.div>
              )}
            </div>

            <div className="bg-[#050b1a] rounded-3xl p-6 mb-6 border border-[#1e293b]">
              <label className="text-sm font-medium text-text-muted px-1 mb-2 flex justify-between">
                <span>{t('Bet Amount')}</span>
              </label>
              
              <div className="flex bg-[#0f172a] rounded-xl p-1 mb-6 border border-[#334155]">
                <button
                  onClick={() => setBetAmount(prev => (Number(prev) / 2).toString())}
                  className="px-4 py-3 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  step="any"
                  className="flex-1 bg-transparent text-center text-white font-bold font-mono text-2xl focus:outline-none"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                />
                <button
                  onClick={() => setBetAmount(prev => (Number(prev) * 2).toString())}
                  className="px-4 py-3 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  +
                </button>
              </div>
              
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
              
              <button
                onClick={handlePlayWheel}
                disabled={isSpinningWheel}
                className="w-full py-5 rounded-2xl font-black text-xl uppercase tracking-wider transition-all
                           bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-400 hover:to-fuchsia-400 
                           disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(168,85,247,0.4)]"
              >
                {isSpinningWheel ? t('Spinning...') : t('Spin The Wheel')}
              </button>
            </div>
        </>
      ) : activeTab === 'mines' ? (
        <MinesGame betAmount={betAmount} onError={setError} />
      ) : activeTab === 'plinko' ? (
        <PlinkoGame betAmount={betAmount} onError={setError} />
      ) : activeTab === 'tower' ? (
        <TowerGame betAmount={betAmount} onError={setError} />
      ) : null}
      
            {/* Fake Live History Table */}
            <div className="bg-[#050b1a] rounded-3xl p-4 md:p-6 mb-6 mt-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#1e293b] max-w-4xl mx-auto w-full">
               <div className="flex justify-between items-center mb-4 border-b border-[#1e293b] pb-2">
                   <div className="text-white font-bold flex gap-2 items-center"><Trophy size={16} className="text-brand-gold"/> All Bets</div>
                   <div className="text-xs text-gray-400">{fakeBets.length} Bets</div>
               </div>
               
               <div className="flex justify-between text-xs text-gray-400 mb-2 px-2 uppercase tracking-wide">
                   <div className="w-1/3">Player</div>
                   <div className="w-1/3 text-center">Bet XRP</div>
                   <div className="w-1/3 text-right">Cash Out</div>
               </div>
               
               <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                   {fakeBets.map((bet) => {
                       const isCashed = isCrashFlying && !isCrashed && bet.cashoutMultiplier > 0 && crashMultiplier >= bet.cashoutMultiplier;
                       const wasCashedBeforeCrash = isCrashed && bet.cashoutMultiplier > 0 && bet.cashoutMultiplier <= crashMultiplier;
                       const displayCashed = isCashed || wasCashedBeforeCrash;
                       const isLost = isCrashed && !displayCashed;

                       return (
                           <div key={bet.id} className={`flex justify-between items-center text-sm px-2 py-2 rounded-lg transition-colors ${displayCashed ? 'bg-green-500/10 border border-green-500/20' : isLost ? 'opacity-50 border border-transparent' : 'bg-[#101b33] border border-transparent'}`}>
                               <div className="w-1/3 flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-inner">{bet.name.charAt(0).toUpperCase()}</div>
                                  <span className={displayCashed ? 'text-green-400 font-bold' : 'text-gray-300'}>{bet.name}</span>
                               </div>
                               <div className="w-1/3 text-center text-white font-bold">{bet.betAmount.toFixed(2)}</div>
                               <div className="w-1/3 text-right">
                                   {displayCashed ? (
                                       <span className="text-green-400 font-black">{bet.cashoutMultiplier.toFixed(2)}x</span>
                                   ) : isLost ? (
                                       <span className="text-gray-600">-</span>
                                   ) : (
                                       <span className="text-gray-400 italic">...</span>
                                   )}
                               </div>
                           </div>
                       );
                   })}
               </div>
            </div>

      </div>
      </div>
      )}
    </div>
  );
}

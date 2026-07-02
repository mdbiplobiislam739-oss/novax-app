import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../lib/store';
import { useTranslation } from '../contexts/TranslationContext';
import { Activity, ChevronDown, Trophy, History, X, Clock, CirclePlay } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Game from './Game';
import { fetchLiveMatches, fetchUpcomingMatches, fetchFootballFixtures, SportsMatch } from '../lib/sportsApi';
import { useTokens } from '../lib/tokens';
import { usePreferredCurrency } from '../hooks/usePreferredCurrency';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Activity },
    { id: 'football', label: 'Football', icon: Trophy },
    { id: 'cricket', label: 'Cricket', icon: Trophy },
    { id: 'basketball', label: 'Basketball', icon: Trophy },
    { id: 'tennis', label: 'Tennis', icon: Trophy },
    { id: 'esports', label: 'E-Sports', icon: Trophy },
];

export default function Sports() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [mainTab, setMainTab] = useState<'sports' | 'casino'>('sports');
    const [activeCategory, setActiveCategory] = useState('all');
    
    // Match States
    const [matchTab, setMatchTab] = useState<'live' | 'upcoming' | 'mybets'>('live');
    const [liveMatches, setLiveMatches] = useState<any[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
    
    const tokens = useTokens();
    const [selectedTokenId, setSelectedTokenId] = usePreferredCurrency('XRP');
    const selectedToken = tokens.find(t => t.symbol === selectedTokenId) || tokens[0];

    // Bet Slip state
    const [betSlip, setBetSlip] = useState<any[]>([]);
    const [betAmount, setBetAmount] = useState<string>('100');
    const [isPlacingBet, setIsPlacingBet] = useState(false);
    const [betError, setBetError] = useState('');
    const [betSuccess, setBetSuccess] = useState(false);

    // Fetch matches
    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const [liveOdds, upcomingOdds, liveFootball, upcomingFootball] = await Promise.all([
                    fetchLiveMatches(),
                    fetchUpcomingMatches(),
                    fetchFootballFixtures('live'),
                    fetchFootballFixtures('upcoming')
                ]);
                
                const hasApiFootball = liveFootball.length > 0 || upcomingFootball.length > 0;
                
                let mergedLive = [...liveOdds];
                let mergedUpcoming = [...upcomingOdds];
                
                if (hasApiFootball) {
                    mergedLive = [...liveOdds.filter(m => m.sport !== 'football'), ...liveFootball];
                    mergedUpcoming = [...upcomingOdds.filter(m => m.sport !== 'football'), ...upcomingFootball];
                }
                
                setLiveMatches(mergedLive);
                setUpcomingMatches(mergedUpcoming);
            } catch (e) {
                console.error("Failed to fetch matches", e);
            }
        };

        fetchMatches();
        const interval = setInterval(fetchMatches, 30000); // refresh every 30s
        
        return () => clearInterval(interval);
    }, []);

    // Filter matches
    const currentMatches = matchTab === 'live' ? liveMatches : upcomingMatches;
    const displayedMatches = activeCategory === 'all' 
        ? currentMatches 
        : currentMatches.filter(m => m.sport === activeCategory);

    const toggleBet = (match: any, marketName: string, selection: any) => {
        setBetSlip(prev => {
            // Check if already in bet slip
            const exists = prev.find(b => b.selectionId === selection.id);
            if (exists) {
                return prev.filter(b => b.selectionId !== selection.id);
            }
            
            // Allow accumulator (multiples). Just add it.
            // If same match is added, usually bookies restrict dependent bets, but we'll allow for demo
            return [...prev, {
                matchId: match.id,
                matchName: `${match.team1} vs ${match.team2}`,
                marketName,
                selectionId: selection.id,
                selectionLabel: selection.label,
                odds: selection.odds
            }];
        });
        setBetSuccess(false);
        setBetError('');
    };

    const isSelected = (selectionId: string) => !!betSlip.find(b => b.selectionId === selectionId);

    const totalOdds = betSlip.reduce((acc, bet) => acc * bet.odds, 1);
    const potentialWin = (Number(betAmount) || 0) * totalOdds;

    const placeBet = async () => {
        if (!user) return;
        const amount = Number(betAmount);
        
        const currentBalance = selectedTokenId === 'XRP' ? user.balance : (user.balances?.[selectedTokenId] || 0);

        if (isNaN(amount) || amount <= 0) {
            setBetError('Invalid bet amount');
            return;
        }
        if (amount > currentBalance) {
            setBetError(`Insufficient ${selectedTokenId} balance`);
            return;
        }
        if (betSlip.length === 0) {
            setBetError('Bet slip is empty');
            return;
        }

        setIsPlacingBet(true);
        setBetError('');
        
        try {
            if (selectedTokenId === 'XRP') {
                await store.updateUser(user.id, { balance: user.balance - amount });
            } else {
                const newBalances = { ...(user.balances || {}) };
                newBalances[selectedTokenId] = (newBalances[selectedTokenId] || 0) - amount;
                await store.updateUser(user.id, { balances: newBalances });
            }
            
            await store.addTransaction({
                userId: user.id,
                type: 'bet' as any,
                amount: -amount,
                status: 'completed',
                description: `Sports Bet (${betSlip.length} selections)`
            });

            await store.addBet({
                userId: user.id,
                amount: amount,
                potentialWin: potentialWin,
                totalOdds: totalOdds,
                selections: betSlip,
                status: 'pending'
            });

            // Simulate successful bet placement
            setTimeout(() => {
                setIsPlacingBet(false);
                setBetSuccess(true);
                setBetSlip([]); // Clear slip
            }, 1000);
            
        } catch (e: any) {
            setBetError(e.message || 'Error placing bet');
            setIsPlacingBet(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-4 flex flex-col gap-4 items-start px-2 pb-20 lg:pb-0">
            {/* Top Navigation Tabs */}
            <div className="w-full flex gap-2 p-1 bg-[#0f172a] rounded-lg border border-[#1e293b] mb-2 mt-2">
                <button
                    onClick={() => setMainTab('sports')}
                    className={`flex-1 py-2 text-sm text-center font-black rounded-md transition-all ${
                        mainTab === 'sports' 
                            ? 'bg-brand-primary text-black shadow-lg' 
                            : 'text-text-muted hover:text-white hover:bg-white/5'
                    }`}
                >
                    SPORTS
                </button>
                <button
                    onClick={() => setMainTab('casino')}
                    className={`flex-1 py-2 text-sm text-center font-black rounded-md transition-all ${
                        mainTab === 'casino' 
                            ? 'bg-brand-primary text-black shadow-lg' 
                            : 'text-text-muted hover:text-white hover:bg-white/5'
                    }`}
                >
                    CASINO GAMES
                </button>
            </div>

            {mainTab === 'casino' ? (
                <div className="w-full">
                    <Game />
                </div>
            ) : (
                <div className="w-full flex flex-col lg:flex-row gap-4">
                    {/* Main Content (Matches) */}
                    <div className="flex-1 w-full space-y-3">
                        
                        {/* Header & Subtabs */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="text-brand-primary" size={20} /> {matchTab === 'mybets' ? 'My Bets' : matchTab === 'live' ? 'Live Events' : 'Upcoming'}
                            </h1>
                            <div className="flex bg-[#0f172a] rounded-lg p-1 border border-[#1e293b] overflow-x-auto w-full md:w-auto text-xs">
                                <button
                                    onClick={() => setMatchTab('live')}
                                    className={`flex-1 px-4 py-1.5 rounded-md font-bold transition-all ${
                                        matchTab === 'live' ? 'bg-[#334155] text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Live
                                </button>
                                <button
                                    onClick={() => setMatchTab('upcoming')}
                                    className={`flex-1 px-4 py-1.5 rounded-md font-bold transition-all ${
                                        matchTab === 'upcoming' ? 'bg-[#334155] text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Upcoming
                                </button>
                                <button
                                    onClick={() => setMatchTab('mybets')}
                                    className={`flex-1 px-4 py-1.5 rounded-md font-bold transition-all ${
                                        matchTab === 'mybets' ? 'bg-[#334155] text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    My Bets
                                </button>
                            </div>
                        </div>

                        {matchTab === 'mybets' ? (
                            <div className="space-y-4">
                                {store.getState().bets?.filter(b => b.userId === user?.id).length === 0 ? (
                                    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] p-8 rounded-2xl text-center text-gray-500">
                                        <History size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>You haven't placed any bets yet.</p>
                                    </div>
                                ) : (
                                    store.getState().bets?.filter(b => b.userId === user?.id).map(bet => (
                                        <div key={bet.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-2xl p-4 shadow-lg">
                                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#334155]">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                        bet.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                        bet.status === 'won' ? 'bg-green-500/20 text-green-500' :
                                                        bet.status === 'cashed_out' ? 'bg-blue-500/20 text-blue-500' :
                                                        'bg-red-500/20 text-red-500'
                                                    }`}>
                                                        {bet.status.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{new Date(bet.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400">Total Odds</div>
                                                    <div className="font-bold text-white">{bet.totalOdds.toFixed(2)}</div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3 mb-4">
                                                {bet.selections.map(sel => (
                                                    <div key={sel.selectionId} className="bg-[#0f172a] p-3 rounded-xl border border-[#1e293b]">
                                                        <div className="text-xs text-gray-400 mb-1">{sel.matchName}</div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold text-white">{sel.selectionLabel} <span className="text-xs font-normal text-brand-primary">({sel.marketName})</span></span>
                                                            <span className="text-brand-secondary font-mono">{sel.odds.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center pt-3 border-t border-[#334155] bg-black/20 -mx-4 -mb-4 p-4 rounded-b-2xl">
                                                <div>
                                                    <div className="text-xs text-gray-400">Stake</div>
                                                    <div className="font-bold text-white">{bet.amount.toFixed(2)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400">Potential Win</div>
                                                    <div className="font-black text-brand-primary text-lg">{bet.potentialWin.toFixed(2)}</div>
                                                </div>
                                                {bet.status === 'pending' && (
                                                    <button 
                                                        onClick={() => {
                                                            store.updateBet(bet.id, { status: 'cashed_out' });
                                                            store.addTransaction({
                                                                userId: user!.id,
                                                                type: 'deposit',
                                                                amount: bet.amount * 0.9,
                                                                status: 'completed',
                                                                description: 'Bet Cashed Out'
                                                            });
                                                            store.updateUser(user!.id, { balance: user!.balance + (bet.amount * 0.9) });
                                                        }}
                                                        className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded-lg text-sm font-bold transition-colors"
                                                    >
                                                        Cash Out ({(bet.amount * 0.9).toFixed(2)})
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <>
                        {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                                activeCategory === cat.id 
                                    ? 'bg-brand-primary text-black' 
                                    : 'bg-[var(--color-bg-card)] text-text-muted hover:text-white border border-[var(--color-border-card)]'
                            }`}
                        >
                            <cat.icon size={16} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Matches List */}
                <div className="space-y-4">
                    {displayedMatches.map(match => (
                        <div key={match.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-2xl overflow-hidden shadow-lg">
                            {/* Match Header */}
                            <div className="bg-[#1e293b]/50 p-3 flex justify-between items-center border-b border-[#334155]">
                                <div className="flex items-center gap-2 text-xs text-brand-primary font-bold">
                                    <CirclePlay size={14} className="animate-pulse" />
                                    <span>{match.league}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-red-400 font-mono bg-red-400/10 px-2 py-0.5 rounded">
                                    <Clock size={12} />
                                    {match.state === 'pre' && match.date ? (
                                        <span>{new Date(match.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    ) : (
                                        <>
                                            {match.period}{' '}
                                            {match.timeMinutes !== undefined && match.sport !== 'cricket' &&
                                              `${String(match.timeMinutes).padStart(2, '0')}:${String(match.timeSeconds).padStart(2, '0')}`
                                            }
                                            {match.overs !== undefined && match.sport === 'cricket' &&
                                              `(${match.overs.toFixed(1)} ov)`
                                            }
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {/* Match Scoreboard */}
                            <div className="p-4 flex justify-between items-center text-white bg-gradient-to-r from-transparent via-[#0f172a] to-transparent">
                                <div className="flex-1 text-right font-bold md:text-lg">{match.team1}</div>
                                <div className="mx-4 text-2xl font-black text-brand-secondary bg-[#020617] px-4 py-1 rounded-lg border border-[#334155] font-mono tracking-widest">
                                    {match.state === 'pre' ? (
                                        'VS'
                                    ) : (
                                        match.sport === 'cricket' 
                                            ? `${match.score1}/${match.score2}` 
                                            : `${match.score1}:${match.score2}`
                                    )}
                                </div>
                                <div className="flex-1 text-left font-bold md:text-lg">{match.team2}</div>
                            </div>

                            {/* Markets */}
                            <div className="p-3 bg-[#0f172a]/50 space-y-3">
                                {Object.entries(match.markets).map(([marketName, selections]) => (
                                    <div key={marketName}>
                                        <div className="text-xs text-text-muted mb-1.5 flex items-center justify-between">
                                            <span>📌 {marketName}</span>
                                            <ChevronDown size={14} className="opacity-50" />
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {(selections as any[]).map(sel => {
                                                const selected = isSelected(sel.id);
                                                return (
                                                    <button
                                                        key={sel.id}
                                                        onClick={() => toggleBet(match, marketName, sel)}
                                                        className={`flex justify-between items-center px-3 py-2 rounded-lg font-bold transition-all ${
                                                            selected 
                                                                ? 'bg-brand-primary text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                                                                : 'bg-[#1e293b] text-white hover:bg-[#334155]'
                                                        }`}
                                                    >
                                                        <span className={selected ? 'text-black/70' : 'text-gray-400 font-normal text-sm'}>{sel.label}</span>
                                                        <span>{sel.odds.toFixed(2)}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}
            </div>

            {/* Sidebar (Bet Slip) */}
            <div className="w-full lg:w-80 shrink-0 space-y-4">
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-2xl p-4 sticky top-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            🧾 Bet Slip
                            {betSlip.length > 0 && (
                                <span className="bg-brand-primary text-black text-xs px-2 py-0.5 rounded-full">{betSlip.length}</span>
                            )}
                        </h2>
                        {betSlip.length > 0 && (
                            <button onClick={() => setBetSlip([])} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                        )}
                    </div>

                    <AnimatePresence>
                        {betSuccess && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-green-500/20 text-green-400 p-3 rounded-xl mb-4 text-sm font-bold text-center border border-green-500/30"
                            >
                                Bet Placed Successfully!
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {betSlip.length === 0 ? (
                        <div className="text-center py-8 text-text-muted">
                            <History className="mx-auto mb-2 opacity-50" size={32} />
                            <p>Your bet slip is empty.</p>
                            <p className="text-xs mt-1">Please make a selection to place a bet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Selected Bets */}
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                                {betSlip.map(bet => (
                                    <div key={bet.selectionId} className="bg-[#0f172a] p-3 rounded-xl border border-[#1e293b] relative group">
                                        <button 
                                            onClick={() => toggleBet({id: bet.matchId}, bet.marketName, {id: bet.selectionId})}
                                            className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="text-xs text-gray-400 mb-1">{bet.matchName}</div>
                                        <div className="flex justify-between items-center font-bold text-white">
                                            <span>{bet.selectionLabel} <span className="text-xs font-normal text-brand-primary ml-1">({bet.marketName})</span></span>
                                            <span className="text-brand-secondary">{bet.odds.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="pt-4 border-t border-[#1e293b] space-y-3">
                                <div className="flex justify-between text-sm text-gray-400">
                                    <span>Total Odds:</span>
                                    <span className="text-white font-bold">{totalOdds.toFixed(2)}</span>
                                </div>
                                                           <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Stake Amount</label>
                                    <div className="flex items-center bg-[#0f172a] rounded-lg border border-[#1e293b] p-1">
                                        <select 
                                            value={selectedTokenId} 
                                            onChange={(e) => setSelectedTokenId(e.target.value)}
                                            className="bg-transparent border-none text-white font-bold text-sm px-2 outline-none appearance-none"
                                        >
                                            {tokens.map(t => (
                                                <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                                            ))}
                                        </select>
                                        <input 
                                            type="number"
                                            value={betAmount}
                                            onChange={(e) => setBetAmount(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-white font-bold py-2 text-right pr-3"
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-[#1e293b] p-3 rounded-lg">
                                    <span className="text-sm font-bold text-gray-300">Potential Win</span>
                                    <span className="font-black text-brand-primary text-lg">{potentialWin.toFixed(2)} {selectedToken.symbol}</span>
                                </div>

                                {betError && <p className="text-red-500 text-xs text-center">{betError}</p>}

                                <button
                                    onClick={placeBet}
                                    disabled={isPlacingBet}
                                    className="w-full py-3 rounded-xl font-bold uppercase tracking-wider bg-brand-primary text-black hover:bg-brand-primary/90 transition-all disabled:opacity-50"
                                >
                                    {isPlacingBet ? 'Processing...' : 'Place Bet'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </div>
            )}
        </div>
    );
}

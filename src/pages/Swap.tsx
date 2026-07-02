import React, { useState, useEffect } from 'react';
import { ArrowDown, Settings2, RefreshCcw, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { formatXRP } from '../lib/utils';
import { store } from '../lib/store';
import { CRYPTO_TOKENS, useTokens } from '../lib/tokens';

export default function Swap() {
  const { user } = useAuth();
  const tokens = useTokens();
  
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [rateModifier, setRateModifier] = useState(1);

  // use token object from hook if available, otherwise fallback to local 
  const [fromTokenId, setFromTokenId] = useState(CRYPTO_TOKENS[0].symbol); // XRP
  const [toTokenId, setToTokenId] = useState(CRYPTO_TOKENS[1].symbol); // USDT

  const fromToken = tokens.find(t => t.symbol === fromTokenId) || tokens[0];
  const toToken = tokens.find(t => t.symbol === toTokenId) || tokens[1];

  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
  const [selectingSide, setSelectingSide] = useState<'from' | 'to'>('from');
  const [searchQuery, setSearchQuery] = useState('');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');

  // Rate calculation
  // current real trx rate from binance vs usdt
  const [liveTrxRate, setLiveTrxRate] = useState(1.59);

  useEffect(() => {
    // Connect to Binance WebSocket for real XRP/USDT live ticker
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/xrpusdt@ticker');
    let latestPrice = 1.59;
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const currentPrice = parseFloat(data.c);
      if (!isNaN(currentPrice)) {
        latestPrice = currentPrice;
      }
    };

    // Throttle state updates for price to 1000ms
    const priceInterval = setInterval(() => {
        setLiveTrxRate(prev => prev !== latestPrice ? latestPrice : prev);
    }, 1000);

    // Simulate price fluctuations for other tokens
    const interval = setInterval(() => {
      setRateModifier(1 + ((Math.random() - 0.5) * 0.005)); // +/- 0.25% noise
    }, 3000);

    return () => {
      ws.close();
      clearInterval(priceInterval);
      clearInterval(interval);
    };
  }, []);

  const getEffectiveRate = (token: typeof CRYPTO_TOKENS[0]) => {
    if (token.symbol === 'USDT') return 1;
    if (token.symbol === 'XRP') return liveTrxRate;
    return token.rate;
  };

  const currentExchangeRate = getEffectiveRate(fromToken) / getEffectiveRate(toToken);

  useEffect(() => {
    // Update toAmount dynamically when rate changes
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      setToAmount((parseFloat(fromAmount) * currentExchangeRate).toFixed(4));
    }
  }, [currentExchangeRate, fromAmount]);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFromAmount(val);
    if (!isNaN(parseFloat(val)) && parseFloat(val) > 0) {
      setToAmount((parseFloat(val) * currentExchangeRate).toFixed(4));
    } else {
      setToAmount('');
    }
  };

  const handleSwapTokens = () => {
    setFromTokenId(toTokenId);
    setToTokenId(fromTokenId);
    setFromAmount(toAmount);
    // useEffect will recalculate toAmount based on new fromAmount
  };

  const openSelector = (side: 'from' | 'to') => {
    setSelectingSide(side);
    setSearchQuery('');
    setIsTokenSelectorOpen(true);
  };

  const selectToken = (token: typeof CRYPTO_TOKENS[0]) => {
    if (selectingSide === 'from') {
      if (token.symbol === toToken.symbol) {
        handleSwapTokens();
      } else {
        setFromTokenId(token.symbol);
      }
    } else {
        if (token.symbol === fromToken.symbol) {
          handleSwapTokens();
        } else {
          setToTokenId(token.symbol);
        }
    }
    setIsTokenSelectorOpen(false);
  };

  const handleSwap = async () => {
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || !user) return;
    
    const fromVal = parseFloat(fromAmount);
    const toVal = parseFloat(toAmount);
    
    const currentBalance = fromToken.symbol === 'XRP' ? user.balance : (user.balances?.[fromToken.symbol] || 0);
    if (currentBalance < fromVal) {
      alert(`Insufficient ${fromToken.symbol} balance.`);
      return;
    }

    setIsSwapping(true);
    
    await new Promise(r => setTimeout(r, 1500));
    
    setIsSwapping(false);
    
    let newBalance = user.balance || 0;
    const newBalances = { ...(user.balances || {}) };
    
    // Deduct
    if (fromToken.symbol === 'XRP') {
      newBalance -= fromVal;
    } else {
      newBalances[fromToken.symbol] = (newBalances[fromToken.symbol] || 0) - fromVal;
    }
    
    // Add
    if (toToken.symbol === 'XRP') {
      newBalance += toVal;
    } else {
      newBalances[toToken.symbol] = (newBalances[toToken.symbol] || 0) + toVal;
    }
    
    await store.updateUser(user.id, { balance: newBalance, balances: newBalances });

    setFromAmount('');
    setToAmount('');
    // Show success toast (in a real app, update balances)
    alert(`Swapped ${fromVal} ${fromToken.symbol} for ${toVal} ${toToken.symbol} successfully.`);
  };

  const filteredTokens = tokens.filter(t => t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 pb-6 p-4 pt-2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Swap</h2>
        <button className="p-2 bg-white/5 rounded-full text-text-muted hover:text-white transition-colors">
          <Settings2 size={20} />
        </button>
      </div>

      <div className="relative">
        {/* From Box */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-2 hover:border-[#00FFFF]/30 transition-colors">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-text-muted">You pay</span>
            <span className="text-xs text-text-muted">Balance: {fromToken.symbol === 'XRP' ? formatXRP(user?.balance || 0) : (user?.balances?.[fromToken.symbol] || 0).toFixed(4)}</span>
          </div>
          <div className="flex items-center justify-between">
            <input 
              type="number" 
              value={fromAmount}
              onChange={handleFromChange}
              placeholder="0"
              className="bg-transparent text-3xl font-bold text-white w-full outline-none placeholder:text-white/20"
            />
            <button onClick={() => openSelector('from')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors ml-4 shrink-0">
               {fromToken.icon.startsWith('http') ? (
                   <img src={fromToken.icon} alt={fromToken.symbol} className="w-5 h-5 rounded-full bg-white/10 p-0.5" />
               ) : (
                   <div className={`w-5 h-5 rounded-full ${fromToken.color} flex items-center justify-center text-[10px]`}>{fromToken.icon}</div>
               )}
               <span className="font-bold text-sm">{fromToken.symbol}</span>
               <ArrowDown size={14} className="text-text-muted" />
            </button>
          </div>
        </div>

        {/* Swap Icon */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button onClick={handleSwapTokens} className="bg-[var(--color-bg-base)] border-4 border-[var(--color-bg-base)] p-2 rounded-xl text-white hover:text-[#00FFFF] transition-colors relative overflow-hidden group">
             <div className="absolute inset-0 bg-[#00FFFF]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             <ArrowDown size={20} className={isSwapping ? "animate-spin" : ""} />
          </button>
        </div>

        {/* To Box */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mt-2 hover:border-[#FF007A]/30 transition-colors">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-text-muted">You receive</span>
            <span className="text-xs text-text-muted">Balance: {toToken.symbol === 'XRP' ? formatXRP(user?.balance || 0) : (user?.balances?.[toToken.symbol] || 0).toFixed(4)}</span>
          </div>
          <div className="flex items-center justify-between">
            <input 
              type="text" 
              value={toAmount}
              readOnly
              placeholder="0"
              className="bg-transparent text-3xl font-bold text-white w-full outline-none placeholder:text-white/20 cursor-not-allowed"
            />
            <button onClick={() => openSelector('to')} className="flex items-center gap-2 bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 px-3 py-1.5 rounded-full transition-colors ml-4 shrink-0">
                {toToken.icon.startsWith('http') ? (
                    <img src={toToken.icon} alt={toToken.symbol} className="w-5 h-5 rounded-full bg-white/10 p-0.5" />
                ) : (
                    <div className={`w-5 h-5 rounded-full ${toToken.color} flex items-center justify-center text-[10px] text-white`}>{toToken.icon}</div>
                )}
               <span className="font-bold text-sm">{toToken.symbol}</span>
               <ArrowDown size={14} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>

      {/* Rate Info */}
      <div className="flex justify-between px-4 text-xs font-bold text-text-muted">
        <span>Rate</span>
        <span>1 {fromToken.symbol} ≈ {currentExchangeRate.toFixed(4)} {toToken.symbol}</span>
      </div>

      {/* Slide to Swap (Mockup) */}
      <div className="mt-8 pt-4">
        <button 
          onClick={handleSwap}
          disabled={!fromAmount || parseFloat(fromAmount) <= 0 || isSwapping}
          className="w-full relative h-[60px] bg-white/5 border border-white/10 rounded-[30px] overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="font-bold text-white/80 group-hover:text-white transition-colors">
               {isSwapping ? (
                 <RefreshCcw className="animate-spin" size={24} />
               ) : (
                 "Swap Now"
               )}
             </span>
          </div>
          {/* Animated Overlay */}
          {!isSwapping && parseFloat(fromAmount) > 0 && (
            <motion.div 
               className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-gold)] opacity-20 pointer-events-none"
               initial={{ width: '0%' }}
               animate={{ width: '100%' }}
               transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isTokenSelectorOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg-base)] text-white"
          >
             <div className="flex justify-between items-center p-4 border-b border-white/10">
                 <h3 className="text-xl font-bold">Select Token</h3>
                 <button onClick={() => setIsTokenSelectorOpen(false)} className="p-2 border border-white/10 rounded-full hover:bg-white/5">
                     <X size={20} />
                 </button>
             </div>
             
             <div className="p-4">
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                    <input 
                        type="text"
                        placeholder="Search by name or symbol"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary"
                    />
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-[70vh] pb-20">
                    {filteredTokens.map(token => (
                        <button 
                            key={token.symbol} 
                            onClick={() => selectToken(token)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                {token.icon.startsWith('http') ? (
                                    <img src={token.icon} alt={token.symbol} className="w-10 h-10 rounded-full" />
                                ) : (
                                    <div className={`w-10 h-10 rounded-full ${token.color} flex items-center justify-center text-lg`}>
                                        {token.icon}
                                    </div>
                                )}
                                <div className="text-left">
                                    <div className="font-bold">{token.symbol}</div>
                                    <div className="text-xs text-text-muted">{token.name}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">
                                    ${getEffectiveRate(token).toFixed(token.rate < 0.01 ? 6 : 4)}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 pt-4 border-t border-white/10">
         <h3 className="text-lg font-bold mb-4 px-2">Markets</h3>
         <div className="relative mb-4 mx-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
                type="text"
                placeholder="Search markets..."
                value={marketSearchQuery}
                onChange={(e) => setMarketSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-primary"
            />
         </div>
         <div className="flex justify-between items-center px-4 py-2 text-xs font-bold text-text-muted mb-2">
            <div>Asset</div>
            <div className="text-right">Price</div>
            <div className="text-right">24h Change</div>
         </div>
         <div className="space-y-2">
            {tokens.filter(t => t.symbol !== 'USDT' && (t.symbol.toLowerCase().includes(marketSearchQuery.toLowerCase()) || t.name.toLowerCase().includes(marketSearchQuery.toLowerCase()))).map(token => {
               const currentPrice = getEffectiveRate(token);
               
               // Generate deterministic 24h change based on symbol to prevent flicker on render
               let hash = 0;
               for (let i = 0; i < token.symbol.length; i++) hash = token.symbol.charCodeAt(i) + ((hash << 5) - hash);
               const randomChange = (((Math.abs(hash) % 400) / 100) - 1.5).toFixed(2); 
               const isPositive = parseFloat(randomChange) >= 0;

               return (
                 <div key={token.symbol} className="grid grid-cols-3 items-center p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-3">
                        {token.icon.startsWith('http') ? (
                            <img src={token.icon} alt={token.symbol} className="w-8 h-8 rounded-full" />
                        ) : (
                            <div className={`w-8 h-8 rounded-full ${token.color} flex items-center justify-center text-sm`}>
                                {token.icon}
                            </div>
                        )}
                        <div>
                            <div className="font-bold text-sm">{token.symbol}</div>
                        </div>
                    </div>
                    <div className="text-right font-mono font-bold text-sm">
                        ${currentPrice.toFixed(token.rate < 0.01 ? 6 : 4)}
                    </div>
                    <div className="flex justify-end">
                       <div className={`px-2 py-1 rounded-lg text-xs font-bold min-w-[60px] text-center ${isPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                           {isPositive ? '+' : ''}{randomChange}%
                       </div>
                    </div>
                 </div>
               )
            })}
         </div>
      </div>
    </div>
  );
}

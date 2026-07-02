import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, ArrowLeft, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { store } from "../lib/store";
import { db } from "../lib/firebase";
import { collection, query, where, addDoc, deleteDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

const PAIRS = [
  { symbol: "TRXUSDT", base: "TRX", quote: "USDT", tvSymbol: "BINANCE:TRXUSDT" },
  { symbol: "BTCUSDT", base: "BTC", quote: "USDT", tvSymbol: "BINANCE:BTCUSDT" },
  { symbol: "ETHUSDT", base: "ETH", quote: "USDT", tvSymbol: "BINANCE:ETHUSDT" },
  { symbol: "BNBUSDT", base: "BNB", quote: "USDT", tvSymbol: "BINANCE:BNBUSDT" },
  { symbol: "SOLUSDT", base: "SOL", quote: "USDT", tvSymbol: "BINANCE:SOLUSDT" },
  { symbol: "XRPUSDT", base: "XRP", quote: "USDT", tvSymbol: "BINANCE:XRPUSDT" },
];

const TIMEFRAMES = [
  { label: "1m", value: "1" },
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "1H", value: "60" },
  { label: "4H", value: "240" },
  { label: "1D", value: "D" },
];

interface Position {
  id: string;
  userId: string;
  symbol: string;
  isLong: boolean;
  entryPrice: number;
  margin: number;
  leverage: number;
  size: number;
  tp: number | null;
  sl: number | null;
  openTime: number;
}

interface Order {
  id: string;
  userId: string;
  symbol: string;
  isLong: boolean;
  limitPrice: number;
  margin: number;
  leverage: number;
  size: number;
  tp: number | null;
  sl: number | null;
  timestamp: number;
}

interface TradeHistory {
  id: string;
  userId: string;
  symbol: string;
  isLong: boolean;
  entryPrice: number;
  closePrice: number;
  margin: number;
  leverage: number;
  pnl: number;
  reason: string;
  closeTime: number;
}

export default function Trade() {
  const { user } = useAuth();
  
  const [selectedSymbol, setSelectedSymbol] = useState("XRPUSDT");
  const [showSelector, setShowSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [prices, setPrices] = useState<Record<string, { price: number, change: number, high: number, low: number, vol: number }>>({});
  const [orderBook, setOrderBook] = useState<{asks: [number, number][], bids: [number, number][]}>({asks: [], bids: []});
  
  const [timeframe, setTimeframe] = useState("15");
  const [orderType, setOrderType] = useState<"Market" | "Limit">("Market");
  const [leverage, setLeverage] = useState(10);
  const [marginAmount, setMarginAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<TradeHistory[]>([]);
  
  const [activeTab, setActiveTab] = useState<"Positions" | "Orders" | "History">("Positions");
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const positionsRef = useRef(positions);
  const ordersRef = useRef(orders);
  const pricesRef = useRef(prices);
  const closingPositions = useRef<Set<string>>(new Set());
  const triggeringOrders = useRef<Set<string>>(new Set());

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch Firestore Data
  useEffect(() => {
    if (!user) return;
    
    const unsubPos = onSnapshot(query(collection(db, "tradePositions"), where("userId", "==", user.id)), (snap) => {
      setPositions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Position)));
    });
    
    const unsubOrd = onSnapshot(query(collection(db, "tradeOrders"), where("userId", "==", user.id)), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    });
    
    const unsubHist = onSnapshot(query(collection(db, "tradeHistory"), where("userId", "==", user.id)), (snap) => {
      const hist = snap.docs.map(d => ({ id: d.id, ...d.data() } as TradeHistory)).sort((a,b) => b.closeTime - a.closeTime);
      setHistory(hist);
    });
    
    return () => { unsubPos(); unsubOrd(); unsubHist(); };
  }, [user]);

  // Sync PnL to Firebase continuously
  useEffect(() => {
    const interval = setInterval(() => {
      if (positionsRef.current.length === 0) return;
      
      positionsRef.current.forEach(pos => {
         const currentPrice = pricesRef.current[pos.symbol]?.price;
         if (currentPrice) {
            const size = (pos.margin / pos.entryPrice) * pos.leverage;
            const pnl = pos.isLong 
               ? (currentPrice - pos.entryPrice) * size
               : (pos.entryPrice - currentPrice) * size;
            const pnlPercent = (pnl / pos.margin) * 100;
            
            updateDoc(doc(db, "tradePositions", pos.id), {
              unrealizedPnl: pnl,
              unrealizedRoe: pnlPercent,
              markPrice: currentPrice
            }).catch(() => {}); // ignore continuous write errors
         }
      });
    }, 1500); // every 1.5 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch Initial Prices & Setup WebSocket
  useEffect(() => {
    // 1. Initial REST API fetch to avoid "Price data not available" delay
    const symbolsParam = JSON.stringify(PAIRS.map(p => p.symbol));
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`)
      .then(res => res.json())
      .then((data: any[]) => {
         if (Array.isArray(data)) {
            const initialPrices: Record<string, any> = {};
            data.forEach(ticker => {
               initialPrices[ticker.symbol] = {
                  price: Number(ticker.lastPrice),
                  change: Number(ticker.priceChangePercent),
                  high: Number(ticker.highPrice),
                  low: Number(ticker.lowPrice),
                  vol: Number(ticker.volume)
               };
            });
            setPrices(prev => {
              const newPrices = { ...prev };
              let changed = false;
              for (const [key, val] of Object.entries(initialPrices)) {
                if (!newPrices[key]) {
                  newPrices[key] = val;
                  changed = true;
                }
              }
              return changed ? newPrices : prev;
            });
         }
      })
      .catch(console.error);

    // 2. Binance WebSocket for Live Mark Prices
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (Array.isArray(data)) {
        data.forEach((ticker: any) => {
          const symbol = ticker.s;
          if (PAIRS.find(p => p.symbol === symbol)) {
            const currentPrice = Number(ticker.c);
            
            setPrices(prev => ({
              ...prev,
              [symbol]: {
                price: currentPrice,
                change: Number(ticker.P),
                high: Number(ticker.h),
                low: Number(ticker.l),
                vol: Number(ticker.v)
              }
            }));
            
            checkTriggers(symbol, currentPrice);
          }
        });
      }
    };
    
    return () => ws.close();
  }, []);

  // Orderbook WebSocket
  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@depth20@100ms`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.b && data.a) {
        setOrderBook({
           bids: data.b.map((b: string[]) => [Number(b[0]), Number(b[1])]),
           asks: data.a.map((a: string[]) => [Number(a[0]), Number(a[1])])
        });
      }
    };
    
    return () => ws.close();
  }, [selectedSymbol]);

  const closePosition = async (pos: Position, closePrice: number, reason: string) => {
     if (!user || closingPositions.current.has(pos.id)) return;
     closingPositions.current.add(pos.id);
     
     try {
       const size = (pos.margin / pos.entryPrice) * pos.leverage;
       const pnl = pos.isLong 
           ? (closePrice - pos.entryPrice) * size
           : (pos.entryPrice - closePrice) * size;
           
       await deleteDoc(doc(db, "tradePositions", pos.id));
       
       await addDoc(collection(db, "tradeHistory"), {
          userId: user.id,
          symbol: pos.symbol,
          isLong: pos.isLong,
          size: pos.size,
          margin: pos.margin,
          leverage: pos.leverage,
          entryPrice: pos.entryPrice,
          closePrice: closePrice,
          pnl: pnl,
          reason: reason,
          openTime: pos.openTime,
          closeTime: Date.now()
       });
       
       const currentUser = store.getState().users.find(u => u.id === user.id) || user;
       const currentUsdt = currentUser.balances?.['USDT'] || 0;
       await store.updateUser(user.id, { balances: { ...(currentUser.balances || {}), USDT: currentUsdt + pos.margin + pnl } });
       
       showToast(`Position closed (${reason}): ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT`, pnl >= 0 ? 'success' : 'error');
     } catch (err) {
       console.error(err);
     } finally {
       closingPositions.current.delete(pos.id);
     }
  };

  const triggerOrder = async (order: Order, fillPrice: number) => {
      if (!user || triggeringOrders.current.has(order.id)) return;
      triggeringOrders.current.add(order.id);
      
      try {
         await deleteDoc(doc(db, "tradeOrders", order.id));
         
         await addDoc(collection(db, "tradePositions"), {
            userId: user.id,
            symbol: order.symbol,
            isLong: order.isLong,
            entryPrice: fillPrice,
            margin: order.margin,
            leverage: order.leverage,
            size: order.size,
            tp: order.tp,
            sl: order.sl,
            openTime: Date.now()
         });
         
         showToast(`Limit order filled: ${order.symbol} at ${fillPrice.toFixed(4)}`, 'success');
      } catch (err) {
         console.error(err);
      } finally {
         triggeringOrders.current.delete(order.id);
      }
  };

  const checkTriggers = (symbol: string, currentPrice: number) => {
     // Check Positions for TP / SL / Liq
     const openPositions = positionsRef.current.filter(p => p.symbol === symbol);
     for (const pos of openPositions) {
        let close = false;
        let closeReason = "";
        
        const size = (pos.margin / pos.entryPrice) * pos.leverage;
        const pnl = pos.isLong 
           ? (currentPrice - pos.entryPrice) * size
           : (pos.entryPrice - currentPrice) * size;
           
        const marginRatio = (pos.margin + pnl) / pos.margin;
        
        if (marginRatio <= -0.5) { close = true; closeReason = "Liquidation"; }
        else if (pos.tp && pos.isLong && currentPrice >= pos.tp) { close = true; closeReason = "Take Profit"; }
        else if (pos.sl && pos.isLong && currentPrice <= pos.sl) { close = true; closeReason = "Stop Loss"; }
        else if (pos.tp && !pos.isLong && currentPrice <= pos.tp) { close = true; closeReason = "Take Profit"; }
        else if (pos.sl && !pos.isLong && currentPrice >= pos.sl) { close = true; closeReason = "Stop Loss"; }
        
        if (close) {
           closePosition(pos, currentPrice, closeReason);
        }
     }
     
     // Check Limit Orders
     const openOrders = ordersRef.current.filter(o => o.symbol === symbol);
     for (const order of openOrders) {
        let trigger = false;
        if (order.isLong && currentPrice <= order.limitPrice) trigger = true;
        if (!order.isLong && currentPrice >= order.limitPrice) trigger = true;
        
        if (trigger) {
           triggerOrder(order, currentPrice);
        }
     }
  };

  const submitOrder = async (isLong: boolean) => {
    if (!user) return;
    const margin = Number(marginAmount);
    if (!margin || isNaN(margin) || margin <= 0) return showToast("Invalid margin amount", "error");
    const currentUsdt = user.balances?.['USDT'] || 0;
    if (currentUsdt < margin) return showToast("Insufficient USDT balance", "error");
    
    const price = prices[selectedSymbol]?.price;
    if (!price) return showToast("Price data not available", "error");
    
    const size = (margin * leverage) / price;
    const tpVal = takeProfit ? Number(takeProfit) : null;
    const slVal = stopLoss ? Number(stopLoss) : null;
    
    try {
       await store.updateUser(user.id, { balances: { ...(user.balances || {}), USDT: currentUsdt - margin } });
       
       if (orderType === "Market") {
         await addDoc(collection(db, "tradePositions"), {
            userId: user.id,
            symbol: selectedSymbol,
            isLong,
            entryPrice: price,
            margin,
            leverage,
            size,
            tp: tpVal,
            sl: slVal,
            openTime: Date.now()
         });
         showToast(`Opened ${isLong ? 'Long' : 'Short'} position`, 'success');
       } else {
         const lPrice = Number(limitPrice);
         if (!lPrice || isNaN(lPrice)) {
            // Refund
            const currentUsdt = user.balances?.['USDT'] || 0;
            await store.updateUser(user.id, { balances: { ...(user.balances || {}), USDT: currentUsdt } });
            return showToast("Invalid limit price", "error");
         }
         await addDoc(collection(db, "tradeOrders"), {
            userId: user.id,
            symbol: selectedSymbol,
            isLong,
            limitPrice: lPrice,
            margin,
            leverage,
            size,
            tp: tpVal,
            sl: slVal,
            timestamp: Date.now()
         });
         showToast(`Limit order placed`, 'success');
       }
       
       setMarginAmount("");
       setTakeProfit("");
       setStopLoss("");
    } catch (err) {
       console.error(err);
       showToast("Failed to place order", "error");
    }
  };

  const cancelOrder = async (order: Order) => {
     if (!user) return;
     try {
        await deleteDoc(doc(db, "tradeOrders", order.id));
        const currentUser = store.getState().users.find(u => u.id === user.id) || user;
        const currentUsdt = currentUser.balances?.['USDT'] || 0;
        await store.updateUser(user.id, { balances: { ...(currentUser.balances || {}), USDT: currentUsdt + order.margin } });
        showToast("Order cancelled & margin refunded", "success");
     } catch (err) {
        showToast("Failed to cancel order", "error");
     }
  };

  const filteredPairs = PAIRS.filter(p => p.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
  const currentPairData = prices[selectedSymbol];

  return (
    <div className="flex flex-col flex-1 w-full max-w-[100vw] bg-[#0b0e14] overflow-y-auto overflow-x-hidden text-white relative pb-[80px]">
       
       {/* Global Notification */}
       <AnimatePresence>
         {notification && (
           <motion.div 
             initial={{ y: -50, opacity: 0 }}
             animate={{ y: 20, opacity: 1 }}
             exit={{ y: -50, opacity: 0 }}
             className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl backdrop-blur-md border font-bold shadow-2xl text-center ${
               notification.type === 'success' 
                 ? 'bg-[#0ECB81]/20 border-[#0ECB81]/50 text-[#0ECB81]' 
                 : 'bg-[#F6465D]/20 border-[#F6465D]/50 text-[#F6465D]'
             }`}
           >
             {notification.message}
           </motion.div>
         )}
       </AnimatePresence>

       {/* Top Header */}
       <div className="flex items-center justify-between p-3 sm:p-4 bg-[#151924]/80 backdrop-blur-md border-b border-[#222633] sticky top-0 z-30 pt-safe">
          <div className="flex flex-col cursor-pointer active:opacity-70 transition-opacity" onClick={() => setShowSelector(true)}>
             <div className="flex items-center gap-1 sm:gap-2 text-lg sm:text-xl font-bold tracking-tight">
               {selectedSymbol.replace("USDT", "/USDT")} <ChevronDown size={18} className="text-gray-400" />
             </div>
             <div className={`text-sm sm:text-base font-semibold ${currentPairData?.change >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
               {currentPairData?.price ? currentPairData.price.toFixed(4) : "..."}
             </div>
          </div>
          
          <div className="flex gap-3 sm:gap-4 text-[10px] sm:text-xs font-mono">
             <div className="flex flex-col items-end">
               <span className="text-gray-500">24h Change</span>
               <span className={currentPairData?.change >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}>
                 {currentPairData?.change >= 0 ? "+" : ""}{currentPairData?.change?.toFixed(2)}%
               </span>
             </div>
             <div className="flex flex-col items-end">
               <span className="text-gray-500">24h High</span>
               <span className="text-gray-200">{currentPairData?.high?.toFixed(4) || "..."}</span>
             </div>
          </div>
       </div>

       {/* Chart Section */}
       <div className="w-full bg-[#0b0e14] border-b border-[#222633]">
          <div className="flex items-center gap-4 sm:gap-6 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-400 overflow-x-auto hide-scrollbar">
             {TIMEFRAMES.map(t => (
               <button 
                 key={t.value} 
                 onClick={() => setTimeframe(t.value)} 
                 className={`whitespace-nowrap transition-colors ${timeframe === t.value ? "text-[#fcd535] font-bold" : "hover:text-white"}`}
               >
                 {t.label}
               </button>
             ))}
          </div>
          <div className="w-full h-[450px] sm:h-[450px] md:h-[600px]">
             <iframe
                key={selectedSymbol + timeframe}
                src={`https://s.tradingview.com/widgetembed/?symbol=${PAIRS.find(p => p.symbol === selectedSymbol)?.tvSymbol || `BINANCE:${selectedSymbol}`}&interval=${timeframe}&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=0&saveimage=0&toolbarbg=0b0e14&hideideas=1&theme=dark&style=1&timezone=Etc%2FUTC&locale=en&backgroundColor=%230b0e14&gridColor=%23151924`}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ display: "block" }}
             ></iframe>
          </div>
       </div>

       {/* Order Entry & Book Section */}
       <div className="flex flex-row w-full">
          
          {/* Order Panel */}
          <div className="w-[55%] sm:w-[60%] md:w-2/3 bg-[#0b0e14] p-2 flex flex-col gap-2 sm:gap-4">
             {/* Type & Leverage row */}
             <div className="flex justify-between items-center bg-[#151924] p-1 rounded-xl border border-[#222633]">
                <div className="flex w-[60%]">
                  {["Market", "Limit"].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setOrderType(t as any)} 
                      className={`flex-1 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-sm font-semibold transition-colors ${orderType === t ? 'bg-[#222633] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex items-center px-1 sm:px-2">
                  <select 
                    className="bg-transparent text-white text-[10px] sm:text-sm font-bold outline-none cursor-pointer"
                    value={leverage}
                    onChange={e => setLeverage(Number(e.target.value))}
                  >
                    {[2, 5, 10, 20, 50, 100].map(l => <option key={l} value={l} className="bg-[#151924]">{l}x</option>)}
                  </select>
                </div>
             </div>
             
             {/* Balance */}
             <div className="flex justify-between text-[10px] sm:text-sm px-1">
                <span className="text-gray-500">Avail. Margin</span>
                <span className="font-bold text-gray-200">{(user?.balances?.['USDT'] || 0).toFixed(2)} USDT</span>
             </div>
             
             {/* Limit Price */}
             {orderType === "Limit" && (
               <div className="flex items-center bg-[#151924] border border-[#222633] rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 focus-within:border-[#fcd535] transition-colors">
                 <input type="number" value={limitPrice} onChange={e=>setLimitPrice(e.target.value)} className="bg-transparent flex-1 text-left outline-none font-mono text-white text-xs sm:text-sm min-w-0" placeholder="Price" />
                 <span className="text-gray-500 text-[10px] sm:text-sm ml-1 sm:ml-2">USDT</span>
               </div>
             )}
             
             {/* Margin Input */}
             <div className="flex items-center bg-[#151924] border border-[#222633] rounded-xl px-2 sm:px-4 py-1.5 sm:py-3 focus-within:border-[#fcd535] transition-colors">
                 <input type="number" value={marginAmount} onChange={e=>setMarginAmount(e.target.value)} className="bg-transparent flex-1 text-left outline-none font-mono text-white text-xs sm:text-sm min-w-0" placeholder="Margin" />
                 <span className="text-gray-500 text-[10px] sm:text-sm ml-1 sm:ml-2">USDT</span>
             </div>

             {/* Order Size Feedback */}
             {marginAmount && !isNaN(Number(marginAmount)) && currentPairData?.price && (
                <div className="flex justify-between text-[10px] sm:text-xs px-1 text-gray-500">
                   <span>Order Size</span>
                   <span>{((Number(marginAmount) * leverage) / currentPairData.price).toFixed(4)} {selectedSymbol.replace("USDT", "")}</span>
                </div>
             )}
             
             {/* TP / SL */}
             <div className="flex flex-col xl:flex-row gap-2 sm:gap-3">
                <div className="flex-1 flex items-center bg-[#151924] border border-[#222633] rounded-xl px-2 sm:px-3 py-1.5 sm:py-2.5 focus-within:border-[#0ECB81] transition-colors">
                   <span className="text-gray-500 text-[10px] sm:text-xs w-4 sm:w-6">TP</span>
                   <input type="number" value={takeProfit} onChange={e=>setTakeProfit(e.target.value)} className="bg-transparent flex-1 text-right outline-none font-mono text-[10px] sm:text-sm text-[#0ECB81] min-w-0" placeholder="Take Profit" />
                </div>
                <div className="flex-1 flex items-center bg-[#151924] border border-[#222633] rounded-xl px-2 sm:px-3 py-1.5 sm:py-2.5 focus-within:border-[#F6465D] transition-colors">
                   <span className="text-gray-500 text-[10px] sm:text-xs w-4 sm:w-6">SL</span>
                   <input type="number" value={stopLoss} onChange={e=>setStopLoss(e.target.value)} className="bg-transparent flex-1 text-right outline-none font-mono text-[10px] sm:text-sm text-[#F6465D] min-w-0" placeholder="Stop Loss" />
                </div>
             </div>
             
             {/* Actions */}
             <div className="flex gap-2 sm:gap-3 mt-1 sm:mt-2">
                <button 
                  onClick={() => submitOrder(true)} 
                  className="flex-1 bg-[#0ECB81] hover:bg-[#0ECB81]/90 text-white font-bold py-1.5 sm:py-2.5 rounded-xl transition-all flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(14,203,129,0.2)] active:scale-95"
                >
                  <span className="text-[10px] sm:text-sm">Buy/Long</span>
                </button>
                <button 
                  onClick={() => submitOrder(false)} 
                  className="flex-1 bg-[#F6465D] hover:bg-[#F6465D]/90 text-white font-bold py-1.5 sm:py-2.5 rounded-xl transition-all flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(246,70,93,0.2)] active:scale-95"
                >
                  <span className="text-[10px] sm:text-sm">Sell/Short</span>
                </button>
             </div>
          </div>

          {/* Order Book */}
          <div className="w-[45%] sm:w-[40%] md:w-1/3 bg-[#0b0e14] p-2 sm:p-4 border-l border-[#222633]">
             <h3 className="text-xs sm:text-sm text-gray-500 font-bold mb-2 sm:mb-3">Order Book</h3>
             <OrderBook currentPrice={currentPairData?.price} orderBook={orderBook} />
          </div>
       </div>

       {/* Tabs Section */}
       <div className="mt-2 border-t border-[#222633] bg-[#0b0e14] w-full max-w-[100vw]">
          <div className="flex gap-4 sm:gap-6 px-3 sm:px-4 pt-3 overflow-x-auto hide-scrollbar border-b border-[#222633]">
             {["Positions", "Orders", "History"].map(t => (
               <button 
                 key={t} 
                 onClick={() => setActiveTab(t as any)} 
                 className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                   activeTab === t 
                     ? "text-white border-b-2 border-[#fcd535]" 
                     : "text-gray-500 hover:text-gray-300"
                 }`}
               >
                 {t} 
                 {t === "Positions" && positions.length > 0 && <span className="ml-1.5 bg-[#222633] text-gray-300 px-1.5 py-0.5 rounded text-xs">{positions.length}</span>}
                 {t === "Orders" && orders.length > 0 && <span className="ml-1.5 bg-[#222633] text-gray-300 px-1.5 py-0.5 rounded text-xs">{orders.length}</span>}
               </button>
             ))}
          </div>
          
          <div className="p-4 bg-[#0b0e14]">
             {activeTab === "Positions" && <PositionsTable positions={positions} prices={prices} onClose={(p, price) => closePosition(p, price, "Manual")} />}
             {activeTab === "Orders" && <OrdersTable orders={orders} currentPrices={prices} onCancel={cancelOrder} />}
             {activeTab === "History" && <HistoryTable history={history} />}
          </div>
       </div>

       {/* Pair Selector Modal */}
       <AnimatePresence>
         {showSelector && (
           <motion.div 
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 50 }}
             className="fixed inset-0 z-50 bg-[#0b0e14] flex flex-col"
           >
             <div className="flex items-center px-4 py-4 gap-3 border-b border-[#222633] pt-safe bg-[#151924]">
               <div className="flex-1 relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search pairs..."
                   className="w-full bg-[#0b0e14] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#222633] outline-none focus:border-[#fcd535] transition-colors"
                   autoFocus
                 />
               </div>
               <button onClick={() => setShowSelector(false)} className="text-gray-400 p-2"><X size={24} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-2">
               {filteredPairs.map((pair) => (
                 <div
                   key={pair.symbol}
                   onClick={() => {
                     setSelectedSymbol(pair.symbol);
                     setShowSelector(false);
                     setSearchQuery("");
                   }}
                   className="flex items-center justify-between p-4 hover:bg-[#151924] rounded-xl cursor-pointer transition-colors border-b border-[#222633]/50 last:border-0"
                 >
                   <div className="flex flex-col gap-1">
                     <span className="font-bold text-lg">{pair.base}<span className="text-gray-500 text-sm">/{pair.quote}</span></span>
                     <span className="text-xs text-gray-500 bg-[#222633] w-fit px-2 py-0.5 rounded">Perpetual</span>
                   </div>
                   <div className="flex flex-col items-end gap-1 font-mono">
                     <span className="font-bold">{prices[pair.symbol]?.price?.toFixed(4) || "..."}</span>
                     <span className={`text-sm ${prices[pair.symbol]?.change >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                       {prices[pair.symbol]?.change >= 0 ? "+" : ""}{prices[pair.symbol]?.change?.toFixed(2) || "0.00"}%
                     </span>
                   </div>
                 </div>
               ))}
               {filteredPairs.length === 0 && (
                 <div className="text-center text-gray-500 mt-10">No pairs found</div>
               )}
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}


/* Sub-Components */

function OrderBook({ currentPrice, orderBook }: { currentPrice?: number, orderBook: {asks: [number, number][], bids: [number, number][]} }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (orderBook.asks.length === 0) {
      const interval = setInterval(() => setTick(t => t + 1), 500);
      return () => clearInterval(interval);
    }
  }, [orderBook.asks.length]);

  const asks = useMemo(() => {
    if (orderBook.asks.length > 0) {
      return [...orderBook.asks].reverse().slice(-5).map(a => ({ price: a[0], amount: a[1] }));
    }
    if (!currentPrice) return [];
    return Array.from({length: 5}).map((_, i) => ({
      price: currentPrice * (1 + (5-i)*0.0005) + (Math.random() * (currentPrice * 0.0001) - (currentPrice * 0.00005)),
      amount: Math.random() * (tick % 2 === 0 ? 500 : 550) + 10
    }));
  }, [currentPrice, orderBook.asks, tick]);
  
  const bids = useMemo(() => {
    if (orderBook.bids.length > 0) {
      return orderBook.bids.slice(0, 5).map(b => ({ price: b[0], amount: b[1] }));
    }
    if (!currentPrice) return [];
    return Array.from({length: 5}).map((_, i) => ({
      price: currentPrice * (1 - (i+1)*0.0005) + (Math.random() * (currentPrice * 0.0001) - (currentPrice * 0.00005)),
      amount: Math.random() * (tick % 2 === 0 ? 500 : 550) + 10
    }));
  }, [currentPrice, orderBook.bids, tick]);

  if (!currentPrice) return <div className="animate-pulse h-48 bg-[#151924] rounded-xl border border-[#222633]"></div>;
  
  return (
    <div className="flex flex-col gap-0.5 font-mono text-[9px] sm:text-xs select-none">
      <div className="flex justify-between text-gray-500 mb-1 sm:mb-2 text-[8px] sm:text-[10px] uppercase tracking-wider">
        <span>Price</span>
        <span>Size</span>
      </div>
      {asks.map((a, i) => (
        <div key={`ask-${i}`} className="flex justify-between text-[#F6465D] relative overflow-hidden py-0.5 sm:py-1 px-1">
           <div className="absolute right-0 top-0 bottom-0 bg-[#F6465D]/10" style={{width: `${(a.amount / 600) * 100}%`}}></div>
           <span className="z-10">{a.price.toFixed(4)}</span>
           <span className="z-10 text-gray-300">{a.amount.toFixed(2)}</span>
        </div>
      ))}
      <div className="py-1 sm:py-2.5 text-sm sm:text-lg font-bold text-center border-y border-[#222633] my-1 text-white">
        {currentPrice.toFixed(4)}
      </div>
      {bids.map((b, i) => (
        <div key={`bid-${i}`} className="flex justify-between text-[#0ECB81] relative overflow-hidden py-0.5 sm:py-1 px-1">
           <div className="absolute right-0 top-0 bottom-0 bg-[#0ECB81]/10" style={{width: `${(b.amount / 600) * 100}%`}}></div>
           <span className="z-10">{b.price.toFixed(4)}</span>
           <span className="z-10 text-gray-300">{b.amount.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function PositionsTable({ positions, prices, onClose }: { positions: Position[], prices: Record<string, any>, onClose: (p: Position, price: number) => void }) {
  if (positions.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
       <div className="w-16 h-16 bg-[#151924] rounded-full flex items-center justify-center mb-3 border border-[#222633]">
         <Search size={24} className="text-gray-600" />
       </div>
       <p>No open positions</p>
    </div>
  );
  
  return (
    <div className="flex flex-col gap-4">
      {positions.map(pos => {
         const currentPrice = prices[pos.symbol]?.price || pos.entryPrice;
         const size = (pos.margin / pos.entryPrice) * pos.leverage;
         const pnl = pos.isLong 
            ? (currentPrice - pos.entryPrice) * size
            : (pos.entryPrice - currentPrice) * size;
         const pnlPercent = (pnl / pos.margin) * 100;
         const isProfitable = pnl >= 0;
         
         return (
           <div key={pos.id} className="bg-[#151924] border border-[#222633] rounded-xl p-3 sm:p-4 flex flex-col gap-3 shadow-lg">
              <div className="flex justify-between items-center border-b border-[#222633] pb-2 sm:pb-3">
                 <div className="flex items-center gap-2">
                   <div className={`w-1.5 h-6 rounded-full ${pos.isLong ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`}></div>
                   <span className="font-bold text-base sm:text-lg tracking-tight">{pos.symbol.replace('USDT', '')}</span>
                   <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded ${pos.isLong ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F6465D]/20 text-[#F6465D]'}`}>
                     {pos.isLong ? 'Long' : 'Short'} {pos.leverage}x
                   </span>
                 </div>
                 <button onClick={() => onClose(pos, currentPrice)} className="bg-[#222633] hover:bg-[#2c3244] text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors">Close</button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm font-mono">
                 <div className="flex flex-col">
                   <span className="text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Margin</span>
                   <span className="text-gray-200">{pos.margin.toFixed(2)}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Entry Price</span>
                   <span className="text-gray-200">{pos.entryPrice.toFixed(4)}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Mark Price</span>
                   <span className="text-gray-200">{currentPrice.toFixed(4)}</span>
                 </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm font-mono bg-[#0b0e14] p-2 sm:p-3 rounded-lg border border-[#222633]">
                 <div className="flex flex-col sm:col-span-2">
                   <span className="text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Unrealized PnL (ROE%)</span>
                   <span className={`font-bold text-sm sm:text-base ${isProfitable ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                     {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT <span className="text-xs sm:text-sm font-normal">({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)</span>
                   </span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">TP / SL</span>
                   <span className="text-gray-400 text-[10px] sm:text-xs">{pos.tp || '-'} / {pos.sl || '-'}</span>
                 </div>
              </div>
           </div>
         );
      })}
    </div>
  );
}

function OrdersTable({ orders, currentPrices, onCancel }: { orders: Order[], currentPrices: Record<string, any>, onCancel: (o: Order) => void }) {
  if (orders.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
       <p>No open orders</p>
    </div>
  );
  
  return (
    <div className="flex flex-col gap-3">
      {orders.map(o => (
         <div key={o.id} className="bg-[#151924] border border-[#222633] rounded-xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${o.isLong ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F6465D]/20 text-[#F6465D]'}`}>
                   Limit {o.isLong ? 'Long' : 'Short'}
                 </span>
                 <span className="font-bold">{o.symbol.replace('USDT', '')}</span>
               </div>
               <button onClick={() => onCancel(o)} className="text-gray-400 hover:text-white px-2 py-1 bg-[#222633] rounded text-xs transition-colors">Cancel</button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-1">
               <div className="flex flex-col">
                 <span className="text-gray-500">Limit Price</span>
                 <span>{o.limitPrice.toFixed(4)}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-gray-500">Margin</span>
                 <span>{o.margin.toFixed(2)}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-gray-500">Current Price</span>
                 <span>{currentPrices[o.symbol]?.price?.toFixed(4) || "-"}</span>
               </div>
            </div>
         </div>
      ))}
    </div>
  );
}

function HistoryTable({ history }: { history: TradeHistory[] }) {
  if (history.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
       <p>No trade history</p>
    </div>
  );
  
  return (
    <div className="flex flex-col gap-3">
      {history.map(h => (
         <div key={h.id} className="bg-[#151924] border border-[#222633] rounded-xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <span className={`w-1.5 h-4 rounded-full ${h.isLong ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`}></span>
                 <span className="font-bold">{h.symbol.replace('USDT', '')}</span>
                 <span className="text-xs text-gray-500">{new Date(h.closeTime).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
               </div>
               <span className={`font-bold text-sm ${h.pnl >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                 {h.pnl >= 0 ? '+' : ''}{h.pnl.toFixed(2)} USDT
               </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-gray-400">
               <div className="flex flex-col">
                 <span className="text-gray-500">Entry</span>
                 <span>{h.entryPrice.toFixed(4)}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-gray-500">Close ({h.reason})</span>
                 <span>{h.closePrice.toFixed(4)}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-gray-500">Margin</span>
                 <span>{h.margin.toFixed(2)}</span>
               </div>
            </div>
         </div>
      ))}
    </div>
  );
}

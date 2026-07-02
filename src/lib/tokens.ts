import { useState, useEffect } from 'react';

export const INITIAL_CRYPTO_TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', rate: 65000, color: 'bg-orange-500', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', rate: 3500, color: 'bg-blue-600', icon: 'Ξ' },
  { symbol: 'BNB', name: 'BNB', rate: 600, color: 'bg-yellow-500', icon: '🔶' },
  { symbol: 'SOL', name: 'Solana', rate: 150, color: 'bg-purple-500', icon: '◎' },
  { symbol: 'XRP', name: 'XRP', rate: 0.60, color: 'bg-gray-800', icon: '✕' },
  { symbol: 'MATIC', name: 'Polygon', rate: 0.75, color: 'bg-purple-600', icon: '🟣' },
  { symbol: 'BUSD', name: 'Binance USD', rate: 1.0, color: 'bg-yellow-500', icon: '💵' },
  { symbol: 'UST', name: 'TerraUSD', rate: 1.0, color: 'bg-blue-500', icon: '💸' },
  { symbol: 'ADA', name: 'Cardano', rate: 0.45, color: 'bg-blue-500', icon: '₳' },
  { symbol: 'AVAX', name: 'Avalanche', rate: 35, color: 'bg-red-500', icon: '🔺' },
  { symbol: 'DOGE', name: 'Dogecoin', rate: 0.15, color: 'bg-yellow-600', icon: '🐕' },
  { symbol: 'SHIB', name: 'Shiba Inu', rate: 0.000018, color: 'bg-orange-600', icon: '🐶' },
  { symbol: 'PEPE', name: 'Pepe', rate: 0.00001, color: 'bg-green-500', icon: '🐸' },
  { symbol: 'TRX', name: 'Tron', rate: 0.12, color: 'bg-red-500', icon: '💎' },
  { symbol: 'USDT', name: 'Tether', rate: 1.0, color: 'bg-[#26A17B]', icon: '💵' },
  { symbol: 'VELVET', name: 'Velvet', rate: 0.4936, color: 'bg-purple-600', icon: '💎' },
  { symbol: 'AERO', name: 'Aero', rate: 0.4561, color: 'bg-blue-500', icon: '✈️' },
  { symbol: 'TAG', name: 'Tag', rate: 0.0010, color: 'bg-green-600', icon: '🏷️' },
  { symbol: 'SKYAI', name: 'Sky AI', rate: 0.3481, color: 'bg-cyan-500', icon: '☁️' },
  { symbol: 'COAI', name: 'Co AI', rate: 0.3335, color: 'bg-teal-500', icon: '🤖' },
  { symbol: 'VIRTUAL', name: 'Virtual', rate: 0.5890, color: 'bg-emerald-500', icon: '🌐' },
  { symbol: 'UAI', name: 'UAI', rate: 0.2858, color: 'bg-indigo-500', icon: '🧠' },
  { symbol: 'ZEST', name: 'Zest', rate: 0.2574, color: 'bg-orange-500', icon: '🍊' },
  { symbol: 'UB', name: 'UB', rate: 0.1181, color: 'bg-blue-600', icon: '🔵' },
  { symbol: 'LDO', name: 'Lido', rate: 0.2749, color: 'bg-sky-500', icon: '💧' },
  { symbol: 'GRAM', name: 'Gram', rate: 1.560, color: 'bg-cyan-500', icon: '💎' }
];

export const CRYPTO_TOKENS = INITIAL_CRYPTO_TOKENS;

let cachedTokens = [...INITIAL_CRYPTO_TOKENS];
let lastFetch = 0;

export function useTokens() {
  const [tokens, setTokens] = useState(cachedTokens);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPrices = async () => {
      // Don't fetch more than once every 30 seconds
      if (Date.now() - lastFetch < 30000 && lastFetch !== 0) {
        if (isMounted) setTokens([...cachedTokens]);
        return;
      }
      
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price');
        const data = await res.json();
        
        const priceMap: Record<string, number> = {};
        data.forEach((item: any) => {
           if (item.symbol) {
             priceMap[item.symbol] = parseFloat(item.price);
           }
        });

        // Ticker symbol in Binance is typically BASEQUOTE. e.g. TRXUSDT.
        const trxUsdt = priceMap['TRXUSDT'] || 0.12;

        const liveTokens = INITIAL_CRYPTO_TOKENS.map(token => {
           if (token.symbol === 'USDT') {
               return { ...token, rate: 1.0 };
           } else {
               const pair = token.symbol + 'USDT';
               if (priceMap[pair]) {
                   return { ...token, rate: parseFloat(priceMap[pair].toFixed(6)) };
               }
               return token;
           }
        });
        
        cachedTokens = liveTokens;
        lastFetch = Date.now();
        if (isMounted) setTokens(liveTokens);
      } catch (e) {
        console.error("Failed to fetch live prices from Binance", e);
      }
    };
    
    fetchPrices();
    
    const interval = setInterval(fetchPrices, 30000);
    return () => {
       isMounted = false;
       clearInterval(interval);
    };
  }, []);

  return tokens;
}

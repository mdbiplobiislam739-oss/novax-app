import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, X, History as HistoryIcon, Plus, Minus, Trash, Zap, Diamond, Package, Crown, Image as ImageIcon, CheckCircle, Clock, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../lib/store';
import { useTokens } from '../lib/tokens';
import { usePreferredCurrency } from '../hooks/usePreferredCurrency';

// Helper to format {selectedToken.symbol} (since we replace {selectedToken.symbol} with {selectedToken.symbol})
const formatCurrency = (amount: number) => {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const TonLogo = ({ size = 16 }: { size?: number }) => (
  <img 
    src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" 
    alt="XRP" 
    style={{ width: size, height: size }} 
    className="rounded-full inline-block object-contain"
  />
);

// Initial Dummy NFTs
const DUMMY_NFTS = [
  { id: '1', title: 'Bored Ape #8832', imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&q=80', basePrice: 1500, ownerId: 'system' },
  { id: '2', title: 'CryptoPunk #4120', imageUrl: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?auto=format&fit=crop&q=80', basePrice: 2200, ownerId: 'system' },
  { id: '3', title: 'Mutant Ape #1421', imageUrl: 'https://images.unsplash.com/photo-1620327663459-009f42d54e43?auto=format&fit=crop&q=80', basePrice: 850, ownerId: 'system' },
  { id: '4', title: 'Cyber Samurai', imageUrl: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&q=80', basePrice: 420, ownerId: 'system' },
  { id: '5', title: 'Doodle #5521', imageUrl: 'https://images.unsplash.com/photo-1580136608260-4ebf15facb4b?auto=format&fit=crop&q=80', basePrice: 310, ownerId: 'system' },
  { id: '6', title: 'Moonbird #902', imageUrl: 'https://images.unsplash.com/photo-1596727147705-61a532a659bd?auto=format&fit=crop&q=80', basePrice: 650, ownerId: 'system' },
  { id: '7', title: 'Azuki #1023', imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674dc9?auto=format&fit=crop&q=80', basePrice: 1100, ownerId: 'system' },
  { id: '8', title: 'Pudgy Penguin #8', imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80', basePrice: 950, ownerId: 'system' },
  { id: '9', title: 'DeGods #1337', imageUrl: 'https://images.unsplash.com/photo-1601296200639-89349ce76a48?auto=format&fit=crop&q=80', basePrice: 780, ownerId: 'system' },
  { id: '10', title: 'CloneX #9021', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80', basePrice: 450, ownerId: 'system' },
  { id: '11', title: 'Meebits #888', imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674dc9?auto=format&fit=crop&q=80', basePrice: 320, ownerId: 'system' },
  { id: '12', title: 'Binance Ape #1', imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&q=80', basePrice: 5000, ownerId: 'system' }
];

// Modal component
function Modal({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#181A20] rounded-3xl border border-gray-800 p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 bg-[#1E2026] rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

const NFTImage = ({ src, alt }: { src: string, alt: string }) => {
  const [error, setError] = useState(false);
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#1E2026] to-[#0B0E11] flex items-center justify-center text-2xl">
      {error ? (
        <span>🦍</span>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          onError={() => setError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default function Shop() {
  const { user, refreshUser } = useAuth();
  const tokens = useTokens();
  const [selectedTokenId, setSelectedTokenId] = usePreferredCurrency('XRP');
  const selectedToken = tokens.find(t => t.symbol === selectedTokenId) || tokens[0];
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'nft' | 'merch' | 'boosts'>('nft');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [products, setProducts] = useState(store.getState().products || []);
  const [nfts, setNfts] = useState(() => (store.getState().nfts || []).map(n => ({...n, priceChange: (Math.random() * 10 - 5)})));

  useEffect(() => {
    const updateState = () => {
      setProducts(store.getState().products || []);
      setNfts((store.getState().nfts || []).map(n => {
        // preserve existing priceChange if possible, or randomize
        const existing = nfts.find(e => e.id === n.id);
        return {
          ...n,
          priceChange: existing?.priceChange || (Math.random() * 10 - 5)
        }
      }));
    };
    window.addEventListener('store_updated', updateState);
    return () => window.removeEventListener('store_updated', updateState);
  }, [nfts]);

  const [nftSubTab, setNftSubTab] = useState<'market' | 'mine'>('market');

  // Live Trading Engine
  useEffect(() => {
    const interval = setInterval(() => {
      setNfts(prev => prev.map(nft => {
        // Fluctuate prices for all NFTs to simulate active live market
        const changeDirection = Math.random() > 0.5 ? 1 : -1;
        const changePercent = (Math.random() * 8 + 2); // 2% to 10%
        const newPrice = nft.price * (1 + (changeDirection * changePercent / 100));
        return {
          ...nft,
          currentPrice: Math.max(1, newPrice),
          priceChange: changeDirection * changePercent
        };
      }));
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Cart Logic
  const [cart, setCart] = useState<any[]>([]);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setMsg('Added to cart!');
    setTimeout(() => setMsg(''), 2000);
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(p => p.id !== id));
  const updateQuantity = (id: string, q: number) => {
    if (q <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(p => p.id === id ? { ...p, quantity: q } : p));
  };

  const handleCheckout = async () => {
    if (!user) return;
    const currentBalance = selectedTokenId === 'XRP' ? user.balance : (user.balances?.[selectedTokenId] || 0);
    if (currentBalance < cartTotal) {
      setMsg(`Insufficient ${selectedTokenId} balance`);
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    
    // Deduct and create order
    if (selectedTokenId === 'XRP') {
      await store.updateUser(user.id, { balance: user.balance - cartTotal });
    } else {
      const newBalances = { ...(user.balances || {}) };
      newBalances[selectedTokenId] = (newBalances[selectedTokenId] || 0) - cartTotal;
      await store.updateUser(user.id, { balances: newBalances });
    }
    await store.addOrder({
      userId: user.id,
      items: cart,
      total: cartTotal,
      shippingAddress: 'Pending Address',
      status: 'pending'
    });
    await store.addTransaction({
      userId: user.id,
      type: 'shop_order',
      amount: cartTotal,
      status: 'completed',
      description: `Merch purchase (${cart.length} items)`
    });
    
    setCart([]);
    setIsCartOpen(false);
    setMsg('Order placed successfully!');
    setTimeout(() => setMsg(''), 3000);
    refreshUser();
  };

  const handleBuyBoost = async (price: number, boostAmt: number) => {
    if (!user) return;
    const currentBalance = selectedTokenId === 'XRP' ? user.balance : (user.balances?.[selectedTokenId] || 0);
    if (currentBalance < price) {
      setMsg(`Insufficient ${selectedTokenId} balance`);
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    const currentMultiplier = user.nftMultiplier || 0;
    
    if (selectedTokenId === 'XRP') {
      await store.updateUser(user.id, { 
        balance: user.balance - price,
        nftMultiplier: currentMultiplier + boostAmt 
      });
    } else {
      const newBalances = { ...(user.balances || {}) };
      newBalances[selectedTokenId] = (newBalances[selectedTokenId] || 0) - price;
      await store.updateUser(user.id, { 
        balances: newBalances,
        nftMultiplier: currentMultiplier + boostAmt 
      });
    }

    await store.addTransaction({
      userId: user.id, type: 'purchase', amount: price, status: 'completed', description: `Bought Mining Booster (+${boostAmt * 100}%) with ${selectedTokenId}`
    });
    setMsg('Booster Purchased!');
    setTimeout(() => setMsg(''), 3000);
    refreshUser();
  };

  const handleBuyNFT = async (nft: typeof nfts[0]) => {
    if (!user) return;
    const currentBalance = selectedTokenId === 'XRP' ? user.balance : (user.balances?.[selectedTokenId] || 0);
    if (currentBalance < nft.price) {
      setMsg(`Insufficient ${selectedTokenId} balance`);
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    // Since these are local dummy NFTs for now, we'll just simulate the purchase by updating local state
    // Deduct balance
    if (selectedTokenId === 'XRP') {
      await store.updateUser(user.id, { balance: user.balance - nft.price });
    } else {
      const newBalances = { ...(user.balances || {}) };
      newBalances[selectedTokenId] = (newBalances[selectedTokenId] || 0) - nft.price;
      await store.updateUser(user.id, { balances: newBalances });
    }
    
    // Create transaction record
    await store.addTransaction({
      userId: user.id,
      type: 'nft_sale',
      amount: nft.price,
      status: 'completed',
      description: `Bought NFT: ${nft.title}`
    });

    // Update NFT owner in local state
    setNfts(prev => prev.map(n => n.id === nft.id ? { ...n, ownerId: user.id } : n));
    
    setMsg('NFT Purchased Successfully!');
    setTimeout(() => setMsg(''), 3000);
    refreshUser();
  };

  const handleSellNFT = async (nft: typeof nfts[0]) => {
    if (!user) return;
    
    // Sell back to market at current price
    const sellPrice = nft.price;
    
    // Add balance
    await store.updateUser(user.id, { balance: user.balance + sellPrice });
    
    await store.addTransaction({
      userId: user.id,
      type: 'nft_sale',
      amount: sellPrice,
      status: 'completed',
      description: `Sold NFT: ${nft.title}`
    });

    // Update NFT owner back to system
    setNfts(prev => prev.map(n => n.id === nft.id ? { ...n, ownerId: 'system' } : n));
    
    setMsg(`NFT Sold for ${formatCurrency(sellPrice)} ${selectedToken.symbol}!`);
    setTimeout(() => setMsg(''), 3000);
    refreshUser();
  };

  return (
    <div className="space-y-4 pb-6 relative min-h-screen font-sans">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-[#F3BA2F]/20">
        <div>
          <h1 className="text-2xl font-bold text-[#F3BA2F]">Shop & NFTs</h1>
          <p className="text-gray-400 mt-1 text-sm">Live Trading & Premium Merch</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400 mb-1">Your Balance</span>
            <div className="flex items-center gap-2 bg-[#1E2026] px-4 py-2 rounded-xl border border-[#F3BA2F]/30 shadow-[0_0_15px_rgba(243,186,47,0.15)]">
              {selectedToken.icon.startsWith('http') || selectedToken.icon.startsWith('/') ? (
                <img src={selectedToken.icon} style={{ width: 20, height: 20 }} className="rounded-full inline-block object-contain" />
              ) : (
                <span style={{ width: 20, height: 20, fontSize: 16 }} className="inline-flex items-center justify-center rounded-full leading-none">{selectedToken.icon}</span>
              )}
              <span className="font-bold text-[#F3BA2F]">{user ? formatCurrency(selectedTokenId === 'XRP' ? user.balance : (user.balances?.[selectedTokenId] || 0)) : '0.00'}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-12 h-12 rounded-xl bg-[#F3BA2F] text-black flex items-center justify-center relative shadow-[0_0_15px_rgba(243,186,47,0.3)] mt-2"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-[#1E2026]">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-sm text-center font-bold shadow-lg ${msg.includes('Insufficient') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#F3BA2F]/10 text-[#F3BA2F] border border-[#F3BA2F]/20'}`}>
          {msg}
        </motion.div>
      )}

      {/* Main Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('nft')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'nft' ? 'bg-[#F3BA2F] text-black shadow-[0_0_10px_rgba(243,186,47,0.3)]' : 'bg-[#1E2026] text-gray-400 border border-gray-800'}`}
        >
          <Diamond size={16} /> NFT Marketplace
        </button>
        <button
          onClick={() => setActiveTab('merch')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'merch' ? 'bg-[#F3BA2F] text-black shadow-[0_0_10px_rgba(243,186,47,0.3)]' : 'bg-[#1E2026] text-gray-400 border border-gray-800'}`}
        >
          <Package size={16} /> Merch Store
        </button>
        <button
          onClick={() => setActiveTab('boosts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'boosts' ? 'bg-[#F3BA2F] text-black shadow-[0_0_10px_rgba(243,186,47,0.3)]' : 'bg-[#1E2026] text-gray-400 border border-gray-800'}`}
        >
          <Zap size={16} /> Mining Boosts
        </button>
      </div>

      {/* Content */}
      <div className="flex justify-end mb-4">
          <select 
              value={selectedTokenId} 
              onChange={(e) => setSelectedTokenId(e.target.value)}
              className="bg-[#1E2026] border border-gray-800 text-white font-bold text-sm px-3 py-1.5 rounded-lg outline-none"
          >
              {tokens.map(t => (
                  <option key={t.symbol} value={t.symbol}>Use {t.symbol} for Shopping</option>
              ))}
          </select>
      </div>
      <div className="space-y-4">
        {activeTab === 'nft' && (
          <>
            {/* Custom Tabs */}
            <div className="flex bg-[#1E2026] rounded-xl border border-gray-800 p-1 w-full max-w-sm mx-auto mb-4">
              <button 
                onClick={() => setNftSubTab('market')} 
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${nftSubTab === 'market' ? 'bg-[#F3BA2F] text-black shadow-[0_0_10px_rgba(243,186,47,0.3)]' : 'text-gray-400 hover:text-white'}`}
              >
                Live Market
              </button>
              <button 
                onClick={() => setNftSubTab('mine')} 
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${nftSubTab === 'mine' ? 'bg-[#F3BA2F] text-black shadow-[0_0_10px_rgba(243,186,47,0.3)]' : 'text-gray-400 hover:text-white'}`}
              >
                My Collection
              </button>
            </div>
          
            {nftSubTab === 'market' ? (
          <div className="flex flex-col gap-4">
            {/* Binance NFT Stats Header */}
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-800">
              <div>
                <div className="text-gray-400 text-[10px] uppercase">Floor Price <span className="text-[#0ECB81] normal-case">+0.00%</span></div>
                <div className="font-bold text-white text-sm">0.72 {selectedToken.symbol}</div>
              </div>
              <div>
                <div className="text-gray-400 text-[10px] uppercase">24H Volume <span className="text-[#0ECB81] normal-case">+1000.00%</span></div>
                <div className="font-bold text-white text-sm">7.92 {selectedToken.symbol}</div>
              </div>
              <div>
                <div className="text-gray-400 text-[10px] uppercase">Total Volume</div>
                <div className="font-bold text-white text-sm">30.9K {selectedToken.symbol}</div>
              </div>
            </div>

            {/* Binance NFT Tabs */}
            <div className="flex gap-6 border-b border-gray-800">
              <button className="pb-2 text-[#F3BA2F] border-b-2 border-[#F3BA2F] font-bold text-sm">Items</button>
              <button className="pb-2 text-gray-500 font-bold text-sm">Analytics</button>
              <button className="pb-2 text-gray-500 font-bold text-sm">Activity</button>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-2.5 text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input type="text" placeholder="Search Items" className="w-full bg-transparent border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#F3BA2F]" />
              </div>
              <button className="p-2 border border-gray-700 rounded-lg text-gray-400">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
              <button className="p-2 border border-gray-700 rounded-lg text-gray-400">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              </button>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{nfts.length} Items, updated just now <svg className="inline w-3 h-3 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg></span>
              <div className="flex gap-4 items-center">
                 <span className="text-white font-bold flex items-center gap-1">Buy Now <X size={12} className="bg-gray-600 rounded-full p-0.5 text-white" /></span>
                 <span className="text-[#F3BA2F] font-bold">Clear All</span>
              </div>
            </div>

            {/* Grid of NFTs */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {nfts.filter(n => n.ownerId === 'system').map((nft, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  key={nft.id} 
                  onClick={() => handleBuyNFT(nft)}
                  className="bg-[#181A20] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-sm cursor-pointer hover:border-[#F3BA2F]/30 transition-all group"
                >
                  <div className="relative aspect-square">
                    <img src={nft.imageUrl} alt={nft.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded flex items-center gap-1 font-bold">
                      <Clock size={10} /> 5 Days left
                    </div>
                  </div>
                  <div className="p-3 bg-[#181A20]">
                    <h3 className="font-bold text-white text-xs line-clamp-1 mb-2">{nft.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-[10px]">Price</span>
                      <span className="font-bold text-white text-xs">{formatCurrency(nft.price)} {selectedToken.symbol}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {nfts.filter(n => n.ownerId === user?.id).length === 0 ? (
              <div className="text-center py-20 bg-[#181A20] rounded-3xl border border-gray-800 text-gray-500">
                <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                <p>Your collection is empty.</p>
                <button onClick={() => setNftSubTab('market')} className="mt-4 text-[#F3BA2F] hover:underline font-bold">Browse Market</button>
              </div>
            ) : (
              nfts.filter(n => n.ownerId === user?.id).map((nft, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  key={nft.id} 
                  className="flex items-center justify-between bg-[#181A20] rounded-2xl p-3 border border-[#F3BA2F]/30 shadow-[0_0_15px_rgba(243,186,47,0.05)] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
                      <NFTImage src={nft.imageUrl} alt={nft.title} />
                      <div className="absolute top-1 left-1 bg-black/60 rounded-full p-0.5">
                        <CheckCircle size={10} className="text-[#F3BA2F]" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Est. Value</span>
                      <h3 className="font-bold text-white text-sm line-clamp-1">{nft.title}</h3>
                      
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${nft.priceChange >= 0 ? 'bg-[#0ECB81]/10 text-[#0ECB81]' : 'bg-[#F6465D]/10 text-[#F6465D]'}`}>
                          {nft.priceChange >= 0 ? '+' : ''}{Math.abs(nft.priceChange).toFixed(2)}%
                        </div>
                        <div className="flex items-center gap-1 text-white font-bold text-sm">
                          {selectedToken.icon.startsWith('http') || selectedToken.icon.startsWith('/') ? (
                            <img src={selectedToken.icon} style={{ width: 14, height: 14 }} className="rounded-full inline-block object-contain" />
                          ) : (
                            <span style={{ width: 14, height: 14, fontSize: 11 }} className="inline-flex items-center justify-center rounded-full leading-none">{selectedToken.icon}</span>
                          )}
                          {formatCurrency(nft.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-center shrink-0 ml-2">
                    <button 
                      onClick={() => handleSellNFT(nft)} 
                      className="bg-transparent border border-[#F3BA2F] text-[#F3BA2F] hover:bg-[#F3BA2F]/10 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                    >
                      Sell
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </>
    )}

        {/* Merch Store */}
        {activeTab === 'merch' && (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product, i) => (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                 key={product.id} className="bg-[#181A20] overflow-hidden rounded-3xl flex flex-col border border-gray-800">
                 <div className="aspect-square relative overflow-hidden bg-gray-900">
                   <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                 </div>
                 <div className="p-4 flex flex-col flex-1">
                   <h3 className="font-bold text-sm line-clamp-1 text-white">{product.name}</h3>
                   <div className="text-[10px] text-gray-500 mb-2">{product.hash}</div>
                   <div className="mt-auto flex items-end justify-between">
                     <div className="flex items-center gap-1.5 font-bold text-white">
                        {selectedToken.icon.startsWith('http') || selectedToken.icon.startsWith('/') ? (
                          <img src={selectedToken.icon} style={{ width: 16, height: 16 }} className="rounded-full inline-block object-contain" />
                        ) : (
                          <span style={{ width: 16, height: 16, fontSize: 12 }} className="inline-flex items-center justify-center rounded-full leading-none">{selectedToken.icon}</span>
                        )} {formatCurrency(product.price)}
                     </div>
                   </div>
                   <button onClick={() => addToCart(product)} className="w-full mt-3 bg-[#1E2026] border border-gray-700 hover:border-[#F3BA2F] text-white font-bold py-2.5 rounded-xl text-xs transition-colors">
                     Add to Cart
                   </button>
                 </div>
               </motion.div>
            ))}
          </div>
        )}

        {/* Static Boosts */}
        {activeTab === 'boosts' && (
          <div className="grid grid-cols-1 gap-4">
             {[
               { name: 'Bronze Pickaxe', boost: 0.5, price: 10, img: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&q=80' },
               { name: 'Silver Drill', boost: 2, price: 50, img: 'https://images.unsplash.com/photo-1640956550267-3e4811a21e6f?auto=format&fit=crop&q=80' },
               { name: 'Gold Rig', boost: 10, price: 200, img: 'https://images.unsplash.com/photo-1620327663459-009f42d54e43?auto=format&fit=crop&q=80' },
             ].map((b,i) => (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                 key={b.name} className="bg-[#181A20] p-4 rounded-3xl flex items-center gap-4 border border-gray-800">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-black">
                    <img src={b.img} alt={b.name} className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{b.name}</h3>
                    <div className="text-sm text-[#F3BA2F] flex items-center gap-1"><Zap size={14} /> +{b.boost * 100}% Mining Rate</div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                     <div className="font-bold mb-2 flex items-center gap-1.5 text-white">
                        {selectedToken.icon.startsWith('http') || selectedToken.icon.startsWith('/') ? (
                          <img src={selectedToken.icon} style={{ width: 16, height: 16 }} className="rounded-full inline-block object-contain" />
                        ) : (
                          <span style={{ width: 16, height: 16, fontSize: 12 }} className="inline-flex items-center justify-center rounded-full leading-none">{selectedToken.icon}</span>
                        )} {formatCurrency(b.price)}
                     </div>
                     <button onClick={() => handleBuyBoost(b.price, b.boost)} className="bg-[#F3BA2F] text-black text-xs font-bold px-5 py-2 rounded-xl shadow-[0_0_10px_rgba(243,186,47,0.2)]">Buy</button>
                  </div>
               </motion.div>
             ))}
          </div>
        )}
      </div>

      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <Modal onClose={() => setIsCartOpen(false)} title="Your Cart">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Your cart is empty</div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center bg-[#1E2026] p-3 rounded-xl border border-gray-800">
                    <img src={item.img} className="w-16 h-16 rounded-lg object-cover" alt="" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-white">{item.name}</h4>
                      <div className="text-[#F3BA2F] font-bold flex items-center gap-1 mt-1">
                         {selectedToken.icon.startsWith('http') || selectedToken.icon.startsWith('/') ? (
                           <img src={selectedToken.icon} style={{ width: 14, height: 14 }} className="rounded-full inline-block object-contain" />
                         ) : (
                           <span style={{ width: 14, height: 14, fontSize: 11 }} className="inline-flex items-center justify-center rounded-full leading-none">{selectedToken.icon}</span>
                         )} {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#181A20] rounded-lg p-1 border border-gray-700">
                       <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-[#1E2026] rounded-md text-gray-400 hover:text-white"><Minus size={14} /></button>
                       <span className="text-sm font-bold w-4 text-center text-white">{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-[#1E2026] rounded-md text-gray-400 hover:text-white"><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-gray-800 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-6 text-lg">
                    <span className="text-gray-400">Total:</span>
                    <span className="font-bold text-white flex items-center gap-2">
                       {selectedToken.icon.startsWith('http') || selectedToken.icon.startsWith('/') ? (
                         <img src={selectedToken.icon} style={{ width: 20, height: 20 }} className="rounded-full inline-block object-contain" />
                       ) : (
                         <span style={{ width: 20, height: 20, fontSize: 16 }} className="inline-flex items-center justify-center rounded-full leading-none">{selectedToken.icon}</span>
                       )} {formatCurrency(cartTotal)}
                    </span>
                  </div>
                  {msg && <div className="mb-4 text-center text-red-500 font-bold bg-red-500/10 p-2 rounded-lg">{msg}</div>}
                  <button onClick={handleCheckout} className="w-full bg-[#F3BA2F] hover:bg-[#F3BA2F]/90 text-black font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(243,186,47,0.3)] transition-colors">
                    Checkout Now
                  </button>
                </div>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}


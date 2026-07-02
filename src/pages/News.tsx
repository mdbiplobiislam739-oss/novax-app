import { ArrowLeft, Newspaper, TrendingUp, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/TranslationContext';
import { useState, useEffect } from 'react';
import { store } from '../lib/store';

const STATIC_NEWS = [
  {
    id: 1,
    title: 'XRP Network Upgrade Complete',
    category: 'Platform Updates',
    date: '2 hours ago',
    content: 'The XRP network upgrade has been successfully completed. All nodes are now synchronized and operations are running smoothly with increased throughput capabilities.',
    type: 'announcement',
  },
  {
    id: 2,
    title: 'New Staking Tiers Announced',
    category: 'Platform Updates',
    date: '5 hours ago',
    content: 'We have introduced new VIP staking tiers to provide better returns for our long-term holders. Check out the Staking section for more details on APY rates.',
    type: 'announcement',
  },
  {
    id: 3,
    title: 'Bitcoin Surges Past $70K',
    category: 'Crypto News',
    date: '1 day ago',
    content: 'Bitcoin has once again broken the $70,000 resistance level amidst growing institutional adoption and ETF inflows. Altcoins are expected to follow the trend soon.',
    type: 'news',
  },
  {
    id: 4,
    title: 'DeFi Ecosystem Growth',
    category: 'Market Insights',
    date: '2 days ago',
    content: 'Total Value Locked (TVL) in Decentralized Finance protocols has reached a new high this quarter. Layer 2 solutions are driving extreme volume and lower fees across the board.',
    type: 'insight',
  },
  {
    id: 5,
    title: 'Global Expansion & Localized Support',
    category: 'Platform Updates',
    date: '3 days ago',
    content: 'We are expanding our platform support to include more localized languages and regional payment gateways to ensure a seamless experience for all global users.',
    type: 'announcement',
  }
];

export default function News() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'All' | 'Platform Updates' | 'Crypto News' | 'Market Insights'>('All');
  const [newsList, setNewsList] = useState<any[]>(STATIC_NEWS);

  useEffect(() => {
    // initial load
    const dynamicNews = store.getState().news || [];
    const formattedDynamic = dynamicNews.map((n: any) => ({
      ...n,
      date: new Date(n.timestamp || Date.now()).toLocaleDateString()
    }));
    setNewsList([...formattedDynamic, ...STATIC_NEWS]);
  }, []);

  const filteredNews = activeTab === 'All' 
    ? newsList 
    : newsList.filter(news => news.category === activeTab);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center border border-[var(--color-border-card)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{t('News & Updates') || "News & Updates"}</h1>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {['All', 'Platform Updates', 'Crypto News', 'Market Insights'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'bg-brand-primary text-black shadow-md' 
                : 'bg-[var(--color-bg-card)] text-text-muted border border-[var(--color-border-card)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews.map((news) => (
          <div key={news.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] p-5 rounded-2xl relative overflow-hidden group">
            {/* Accent styling based on type */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              news.type === 'announcement' ? 'bg-[#00FFFF]' : 
              news.type === 'news' ? 'bg-[#fcd535]' : 'bg-[#FF007A]'
            }`} />
            
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {news.type === 'announcement' && <Bell size={14} className="text-[#00FFFF]" />}
                {news.type === 'news' && <Newspaper size={14} className="text-[#fcd535]" />}
                {news.type === 'insight' && <TrendingUp size={14} className="text-[#FF007A]" />}
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  news.type === 'announcement' ? 'text-[#00FFFF]' : 
                  news.type === 'news' ? 'text-[#fcd535]' : 'text-[#FF007A]'
                }`}>
                  {news.category}
                </span>
              </div>
              <span className="text-xs text-text-muted">{news.date}</span>
            </div>
            
            <h3 className="font-bold text-lg mb-2 text-white">{news.title}</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              {news.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

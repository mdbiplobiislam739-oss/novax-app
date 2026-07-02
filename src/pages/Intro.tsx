import React, { useState } from 'react';
import { ArrowRight, ChevronRight, Zap, TrendingUp, ShieldCheck, Download, Pickaxe, Image as ImageIcon, Trophy, Gamepad2 } from 'lucide-react';

export default function Intro({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Welcome to NovaX',
      description: 'Your premium crypto earning and trading platform. Start mining, trading and staking in one place.',
      icon: <Zap size={64} className="text-brand-primary" />,
      color: 'from-brand-primary/20 to-transparent'
    },
    {
      title: 'Cloud Mining',
      description: 'Mine XRP daily with our powerful cloud infrastructure. Maximize your hashrate and earn passive income.',
      icon: <Pickaxe size={64} className="text-[#F3BA2F]" />,
      color: 'from-[#F3BA2F]/20 to-transparent'
    },
    {
      title: 'NFT Marketplace',
      description: 'Trade premium NFTs, exclusive digital art, and limited edition drops directly on our platform.',
      icon: <ImageIcon size={64} className="text-purple-500" />,
      color: 'from-purple-500/20 to-transparent'
    },
    {
      title: 'Live Sports & Games',
      description: 'Bet on live sports, play casino games, and win massive rewards in real-time.',
      icon: <Trophy size={64} className="text-[#0ECB81]" />,
      color: 'from-[#0ECB81]/20 to-transparent'
    },
    {
      title: 'Secure & Reliable',
      description: 'Bank-grade security for your assets. Quick deposits and lightning-fast withdrawals.',
      icon: <ShieldCheck size={64} className="text-blue-500" />,
      color: 'from-blue-500/20 to-transparent'
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      localStorage.setItem('intro_seen', 'true');
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-bg-base)] flex flex-col justify-between" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b overflow-hidden" style={{ backgroundImage: `linear-gradient(to bottom, var(--tw-gradient-stops))` }}>
          
         {/* Animated Background blob */}
         <div className={`absolute top-1/4 w-64 h-64 bg-gradient-to-br ${slides[currentSlide].color} rounded-full blur-[80px] -z-10 transition-colors duration-700`}></div>

         <div className="mb-12 animate-bounce-slow">
            {slides[currentSlide].icon}
         </div>

         <h1 className="text-3xl font-bold text-white mb-4 animate-fade-in">
           {slides[currentSlide].title}
         </h1>
         <p className="text-gray-400 text-lg max-w-sm animate-fade-in-up delay-100">
           {slides[currentSlide].description}
         </p>
      </div>

      <div className="p-8 pb-12 bg-[var(--color-bg-card)] rounded-t-[40px] border-t border-white/5 relative z-10 shrink-0">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-cyan-400' : 'w-2 bg-gray-600'}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="w-full bg-cyan-400 text-black font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'} 
          {currentSlide === slides.length - 1 ? <ArrowRight size={20} /> : <ChevronRight size={20} />}
        </button>
        <div className="h-safe" />
      </div>
    </div>
  );
}

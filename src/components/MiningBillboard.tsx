import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function MiningBillboard({ actionText, onClickOverride }: { actionText?: string, onClickOverride?: () => void }) {
  const navigate = useNavigate();

  const handleClick = () => {
      if (onClickOverride) {
          onClickOverride();
      } else {
          navigate('/mining');
      }
  };

  return (
    <div className="relative rounded-2xl sm:rounded-[2rem] overflow-hidden glass-panel group h-40 sm:h-52 flex cursor-pointer transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(0,240,255,0.1)]" onClick={handleClick}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-brand-gold/30 via-[var(--color-bg-base)] to-[var(--color-bg-base)]"></div>
      
      <div className="absolute top-0 left-0 w-[55%] h-full flex items-center z-10">
         <div className="absolute top-0 left-0 w-24 sm:w-32 h-full bg-black/40 border-r border-brand-primary/30 backdrop-blur-sm" style={{ clipPath: 'polygon(0 0, 100% 0%, 75% 20%, 95% 45%, 65% 65%, 85% 80%, 45% 100%, 0 100%)' }}></div>
         
         <motion.div 
           animate={{ opacity: [0.15, 0.4, 0.15] }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-1/2 left-20 sm:left-28 w-32 sm:w-40 h-24 sm:h-32 -translate-y-1/2 bg-gradient-to-r from-brand-primary/20 to-transparent pointer-events-none" 
           style={{ clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 60%)' }}
         ></motion.div>

         <motion.div
           animate={{ rotate: [-8, 15, -8], x: [0, 6, 0] }}
           transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
           className="absolute top-1/2 left-[3rem] sm:left-[5rem] -translate-y-[40%] origin-bottom-right"
         >
            <div className="text-4xl sm:text-5xl filter drop-shadow-[0_0_15px_rgba(0,240,255,0.8)] relative z-10">
              🐱
               <div className="absolute top-[-5px] sm:top-[-10px] right-[-10px] sm:right-[-15px] text-2xl sm:text-4xl rotate-[15deg]">⛏️</div>
            </div>
         </motion.div>
         
         <div className="absolute top-1/2 left-20 sm:left-32">
           {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  x: [0, Math.random() * 40 + 20], 
                  y: [0, (Math.random() - 0.5) * 60], 
                  opacity: [1, 1, 0],
                  scale: [1, 0]
                }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-brand-primary rounded-full shadow-[0_0_8px_var(--color-brand-primary)]"
              />
           ))}
         </div>
      </div>

      <div className="absolute top-0 right-[-15px] w-1/2 h-full flex items-center justify-center z-10">
          <motion.div 
             animate={{ y: [-6, 6, -6] }}
             transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
             className="relative z-10 w-[80px] h-[80px] sm:w-[110px] sm:h-[110px] rounded-full bg-gradient-to-br from-brand-primary to-brand-gold border-2 border-brand-primary/50 shadow-[0_0_40px_rgba(0,240,255,0.4)] flex items-center justify-center transform -rotate-12"
           >
              <div className="w-[85%] h-[85%] rounded-full border border-white/20 bg-gradient-to-tr from-[#1A0B2E] to-[#4A0033] flex items-center justify-center relative overflow-hidden shadow-inner">
                 <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full pointer-events-none"></div>
                 <div className="w-[50%] h-[50%] border-[1.5px] sm:border-[2px] border-brand-primary rotate-45 flex flex-col justify-between p-[1px] shadow-[0_0_10px_var(--color-brand-primary)]">
                    <div className="w-full h-1/2 border-b-[1.5px] sm:border-b-[2px] border-brand-primary"></div>
                 </div>
              </div>
          </motion.div>

          <motion.div 
             animate={{ y: [4, -4, 4], x: [0, -5, 0], rotate: 15 }}
             transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
             className="absolute top-8 left-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark border border-brand-gold shadow-[0_0_15px_rgba(255,0,122,0.4)] flex items-center justify-center blur-[0.5px]"
           >
              <div className="w-[80%] h-[80%] rounded-full border-[0.5px] border-white/30 bg-gradient-to-tr from-[#1A0B2E] to-[#4A0033] flex items-center justify-center">
                 <div className="w-[50%] h-[50%] border border-brand-gold rotate-45"></div>
              </div>
          </motion.div>
          
          <motion.div 
             animate={{ y: [-5, 5, -5], x: [0, 8, 0], rotate: -20 }}
             transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
             className="absolute bottom-6 left-6 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-gold border border-brand-primary shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center blur-[0.5px]"
           >
              <div className="w-[80%] h-[80%] rounded-full border-[0.5px] border-white/30 bg-gradient-to-tr from-[#4A0033] to-[#1A0B2E] flex items-center justify-center">
                 <div className="w-[50%] h-[50%] border border-brand-primary rotate-45"></div>
              </div>
          </motion.div>
          
          <motion.div 
             animate={{ y: [3, -3, 3] }}
             transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
             className="absolute top-10 right-2 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-brand-primary shadow-[0_0_10px_var(--color-brand-primary)]"
           />
          <motion.div 
             animate={{ y: [-3, 3, -3] }}
             transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
             className="absolute bottom-10 right-4 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-gold shadow-[0_0_8px_var(--color-brand-gold)]"
           />
          <motion.div 
             animate={{ y: [2, -2, 2] }}
             transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
             className="absolute top-1/2 left-[-10px] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
           />
      </div>

      <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="px-3 sm:px-5 py-1 sm:py-1.5 bg-gradient-to-r from-brand-primary via-[#B026FF] to-brand-gold rounded-full text-white text-[9px] sm:text-[11px] uppercase tracking-wider font-bold shadow-[0_0_15px_rgba(0,240,255,0.5)] whitespace-nowrap">
          {actionText || 'Start Mining'}
        </div>
      </div>
    </div>
  );
}

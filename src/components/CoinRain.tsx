import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function CoinRain() {
  const [coins, setCoins] = useState<{ id: number; left: number; delay: number; duration: number; size: number }[]>([]);

  useEffect(() => {
    // Generate fewer coins for better performance
    const initialCoins = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 4, // 4 to 8 seconds
      size: Math.random() * 15 + 15, // 15 to 30 px
    }));
    setCoins(initialCoins);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-40">
      {coins.map(coin => (
        <motion.div
          key={coin.id}
          className="absolute top-[-50px] flex items-center justify-center text-brand-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]"
          style={{
            left: `${coin.left}%`,
            width: `${coin.size}px`,
            height: `${coin.size}px`,
          }}
          animate={{
            y: ['0vh', '110vh'],
            rotate: [0, 360],
          }}
          transition={{
            duration: coin.duration,
            delay: coin.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <img src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" alt="XRP" className="w-full h-full opacity-70 object-contain" />
        </motion.div>
      ))}
    </div>
  );
}

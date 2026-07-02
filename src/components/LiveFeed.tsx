import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateId } from '../lib/utils';
import { Bell } from 'lucide-react';

interface FeedItem {
  id: string;
  text: string;
}

export function LiveFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Generate initial feed data
    const generateFeedItem = () => {
      const actions = ['withdrew', 'deposited', 'upgraded to VIP', 'bought product'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const user = `User ***${Math.floor(Math.random() * 900) + 100}`;
      
      let amount = '';
      if (action === 'withdrew') amount = `${Math.floor(Math.random() * 5000) + 100} XRP`;
      else if (action === 'deposited') amount = `${Math.floor(Math.random() * 10000) + 500} XRP`;
      else if (action === 'upgraded to VIP') amount = `${Math.floor(Math.random() * 5) + 1}`;
      else amount = '';

      return {
        id: generateId(),
        text: `${user} just ${action} ${amount}`.trim()
      };
    };

    const initialFeed = Array.from({ length: 50 }, generateFeedItem);
    setFeed(initialFeed);

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % initialFeed.length);
    }, 4000); // Change message every 4 seconds

    return () => clearInterval(interval);
  }, []);

  if (feed.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-40 bg-black/50 backdrop-blur-md border border-[var(--color-border-card)] rounded-2xl p-2 px-4 shadow-xl max-w-[280px]">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Bell size={18} className="text-brand-primary" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </div>
        <div className="flex-1 overflow-hidden h-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={feed[currentIndex].id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center text-sm font-medium text-white/90 whitespace-nowrap"
            >
              {feed[currentIndex].text}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

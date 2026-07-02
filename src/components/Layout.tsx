import { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Pickaxe, Crown, Users, User, LogOut, Shield, Activity, Bell, Volume2, VolumeX, Trophy } from 'lucide-react';
import { cn, formatXRP } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../contexts/TranslationContext';
import { getIsMuted, toggleMute } from '../lib/audio';
import { usePreferredCurrency } from '../hooks/usePreferredCurrency';
import { formatCurrency } from '../lib/utils';
import novaxLogo from '../assets/images/novax_logo_1782982838843.jpg';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  const { language, setLanguage, t } = useTranslation();
  const [preferredCurrency] = usePreferredCurrency('XRP');
  
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(getIsMuted());
  }, []);

  const handleMuteToggle = () => {
    setMuted(toggleMute());
  };

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('store_updated', handler);
    return () => window.removeEventListener('store_updated', handler);
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const navItems = [
    { name: t('Home'), path: '/', icon: Home },
    { name: t('Mining'), path: '/mining', icon: Pickaxe },
    { name: t('Trade'), path: '/trade', icon: Activity },
    { name: t('Sports'), path: '/sports', icon: Trophy },
    { name: t('VIP'), path: '/vip', icon: Crown },
    { name: t('Profile'), path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#050b1a] flex justify-center">
      <div className="w-full max-w-[400px] bg-[var(--color-bg-base)] text-white flex flex-col pt-safe relative min-h-screen shadow-2xl border-x-0 sm:border-x border-[var(--color-border-card)] mx-auto overflow-hidden">

        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-[var(--color-bg-card)]/80 backdrop-blur-md border-b border-[var(--color-border-card)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={novaxLogo} alt="NovaX Logo" className="w-12 h-12 rounded-full" />
            <div id="google_translate_element" className="mt-1"></div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handleMuteToggle} className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white">
               {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
             </button>
             <button onClick={() => navigate('/notifications')} className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
               <Bell size={18} />
               {/* If we had unread logic, we could show a dot here */}
               <span className="absolute top-1 right-1 w-2 h-2 bg-brand-primary rounded-full"></span>
             </button>
             <div className="text-right">
               <div className="text-xs text-text-muted">{t('My Balance')}</div>
               <div className="font-bold text-gradient-gold">
                  {preferredCurrency === 'XRP' ? formatXRP(user.balance) : `${formatCurrency(user.balances?.[preferredCurrency] || 0)} ${preferredCurrency}`}
               </div>
             </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden relative max-w-7xl mx-auto w-full">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="px-2 md:px-4 pb-20"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-[400px] z-50 bg-[var(--color-bg-card)]/90 backdrop-blur-lg border-t border-[var(--color-border-card)] px-2 pb-safe pt-2">
        <ul className="flex justify-around items-center w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <li key={item.path} className="w-full max-w-[120px]">
                <Link
                  to={item.path}
                  className="flex flex-col items-center p-2 relative group"
                >
                  <div className={cn(
                    "p-2 rounded-2xl transition-all duration-300",
                    isActive ? "bg-brand-primary/20 text-brand-primary" : "text-text-muted group-hover:text-white"
                  )}>
                    <Icon size={22} className={cn("transition-transform duration-300", isActive && "scale-110")} />
                  </div>
                  <span className={cn(
                    "text-[10px] mt-1 font-medium transition-colors",
                    isActive ? "text-brand-primary" : "text-text-muted"
                  )}>
                    {item.name}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="bottom-nav-indicator"
                      className="absolute -top-3 w-8 h-1 bg-brand-primary rounded-full drop-shadow-[0_0_6px_rgba(255,90,0,0.8)]"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('store_updated', handler);
    return () => window.removeEventListener('store_updated', handler);
  }, []);

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-white flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[var(--color-bg-card)] border-b md:border-r border-[var(--color-border-card)] p-4 flex md:flex-col items-center md:items-stretch justify-between md:justify-start shrink-0">
        <div className="flex items-center gap-2 md:mb-8 px-2">
           <Shield className="text-brand-primary shrink-0" size={28} />
           <span className="font-bold text-lg md:text-xl text-white">Admin Panel</span>
        </div>
        
        <nav className="flex-1 flex md:flex-col gap-2 px-2 overflow-x-auto items-center md:items-stretch justify-center md:justify-start">
           <Link to="/admin" className="flex items-center gap-2 px-4 py-2 md:py-3 rounded-xl bg-brand-primary/10 text-brand-primary font-medium hover:bg-brand-primary/20 transition-colors">
              <Home size={18} className="shrink-0" /> <span className="hidden sm:inline">Dashboard</span>
           </Link>
           <Link to="/" className="flex items-center gap-2 px-4 py-2 md:py-3 rounded-xl text-text-muted hover:bg-white/5 transition-colors">
              <User size={18} className="shrink-0" /> <span className="hidden sm:inline">User App</span>
           </Link>
        </nav>

        <button onClick={logout} className="flex items-center gap-2 px-4 py-2 md:py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors md:mt-auto font-medium shrink-0">
          <LogOut size={18} className="shrink-0" /> <span className="hidden sm:inline">Logout</span>
        </button>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 relative md:max-h-screen overflow-y-auto">
         <div className="p-4 md:p-8">
           <Outlet />
         </div>
      </main>
    </div>
  );
}

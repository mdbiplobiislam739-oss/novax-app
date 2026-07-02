import { ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/TranslationContext';
import { store } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';

export default function Notifications() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const notices = store.getState().notices.filter(n => n.isActive).sort((a,b) => b.timestamp - a.timestamp);
  const transactions = store.getState().transactions.filter(tr => tr.userId === user?.id).sort((a,b) => b.timestamp - a.timestamp).slice(0, 5);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center border border-[var(--color-border-card)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{t('Notifications')}</h1>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-text-muted px-1 uppercase tracking-wider">System Notices</h2>
        {notices.map(notice => (
          <div key={notice.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] p-4 rounded-2xl flex gap-4 items-start shadow-sm">
            <div className="p-2 bg-brand-primary/10 rounded-full text-brand-primary shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-200">{notice.text}</p>
              <div className="text-xs text-text-muted mt-2">{new Date(notice.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
        {notices.length === 0 && <div className="text-center text-text-muted py-4">No system notices</div>}

        <h2 className="text-sm font-bold text-text-muted px-1 uppercase tracking-wider mt-6">Recent Activity Alerts</h2>
        {transactions.map(tx => (
          <div key={tx.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] p-4 rounded-2xl flex gap-4 items-start shadow-sm">
             <div className="p-2 bg-white/5 rounded-full text-text-muted shrink-0">
               <Bell size={20} />
             </div>
             <div>
               <p className="text-sm font-medium">Your {tx.type} was {tx.status}</p>
               <p className="text-xs text-gray-400 mt-1">{tx.description}</p>
               <div className="text-xs text-text-muted mt-2">{new Date(tx.timestamp).toLocaleString()}</div>
             </div>
          </div>
        ))}
        {transactions.length === 0 && <div className="text-center text-text-muted py-4">No recent activity</div>}
      </div>
    </div>
  );
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'English' | 'Bengali' | 'Hindi';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  English: {
    'Home': 'Home',
    'Mining': 'Mining',
    'Trade': 'Trade',
    'VIP': 'VIP',
    'Team': 'Team',
    'Profile': 'Profile',
    'Deposit': 'Deposit',
    'Withdraw': 'Withdraw',
    'Transfer': 'Transfer',
    'Send': 'Send',
    'Receive': 'Receive',
    'Swap': 'Swap',
    'Buy': 'Buy',
    'History': 'History',
    'Leaderboard': 'Leaderboard',
    'Support': 'Support',
    'My Balance': 'My Balance',
    'Notifications': 'Notifications',
    'Stake': 'Stake',
    'Live Updates': 'Live Updates',
    'Total Assets': 'Total Assets',
    'Total Earned': 'Total Earned',
    'Account Settings': 'Account Settings',
    'Financial Records': 'Financial Records',
    'My Team': 'My Team',
    'About Us': 'About Us',
    'Language': 'Language',
    'Install App': 'Install App',
    'Sign Out': 'Sign Out'
  },
  Bengali: {
    'Home': 'হোম',
    'Mining': 'মাইনিং',
    'Trade': 'ট্রেড',
    'VIP': 'ভিআইপি',
    'Team': 'টিম',
    'Profile': 'প্রোফাইল',
    'Deposit': 'ডিপোজিট',
    'Withdraw': 'উত্তোলন',
    'Transfer': 'ট্রান্সফার',
    'Send': 'পাঠান',
    'Receive': 'গ্রহণ করুন',
    'Swap': 'অদলবদল',
    'Buy': 'কিনুন',
    'History': 'ইতিহাস',
    'Leaderboard': 'লিডারবোর্ড',
    'Support': 'সাপোর্ট',
    'My Balance': 'আমার ব্যালেন্স',
    'Notifications': 'নোটিফিকেশন',
    'Stake': 'স্টেক',
    'Live Updates': 'লাইভ আপডেট',
    'Total Assets': 'মোট সম্পদ',
    'Total Earned': 'মোট আয়',
    'Account Settings': 'অ্যাকাউন্ট সেটিংস',
    'Financial Records': 'আর্থিক লেনদেন',
    'My Team': 'আমার টিম',
    'About Us': 'আমাদের সম্পর্কে',
    'Language': 'ভাষা',
    'Install App': 'অ্যাপ ইনস্টল করুন',
    'Sign Out': 'লগ আউট'
  },
  Hindi: {
    'Home': 'होम',
    'Mining': 'माइनिंग',
    'Trade': 'व्यापार',
    'VIP': 'वीआईपी',
    'Team': 'टीम',
    'Profile': 'प्रोफाइल',
    'Deposit': 'जमा',
    'Withdraw': 'निकासी',
    'Transfer': 'ट्रांसफर',
    'Send': 'भेजें',
    'Receive': 'प्राप्त करें',
    'Swap': 'स्वैप',
    'Buy': 'खरीदें',
    'History': 'इतिहास',
    'Leaderboard': 'लीडरबोर्ड',
    'Support': 'सपोर्ट',
    'My Balance': 'मेरा बैलेंस',
    'Notifications': 'सूचनाएं',
    'Stake': 'स्टेक',
    'Live Updates': 'लाइव अपडेट',
    'Total Assets': 'कुल संपत्ति',
    'Total Earned': 'कुल आय',
    'Account Settings': 'खाता सेटिंग्स',
    'Financial Records': 'वित्तीय रिकॉर्ड',
    'My Team': 'मेरी टीम',
    'About Us': 'हमारे बारे में',
    'Language': 'भाषा',
    'Install App': 'ऐप इंस्टॉल करें',
    'Sign Out': 'साइन आउट'
  }
};

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('appLang') as Language) || 'English';
  });

  useEffect(() => {
    localStorage.setItem('appLang', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) throw new Error('useTranslation must be used within TranslationProvider');
  return context;
}

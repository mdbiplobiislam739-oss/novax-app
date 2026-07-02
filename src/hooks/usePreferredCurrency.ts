import { useState, useEffect } from 'react';

export function usePreferredCurrency(defaultCurrency = 'XRP') {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('preferredCurrency') || defaultCurrency;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setCurrency(localStorage.getItem('preferredCurrency') || defaultCurrency);
    };
    window.addEventListener('preferred_currency_changed', handleStorageChange);
    return () => window.removeEventListener('preferred_currency_changed', handleStorageChange);
  }, [defaultCurrency]);

  const setGlobalCurrency = (newCurrency: string) => {
    localStorage.setItem('preferredCurrency', newCurrency);
    setCurrency(newCurrency);
    window.dispatchEvent(new Event('preferred_currency_changed'));
  };

  return [currency, setGlobalCurrency] as const;
}

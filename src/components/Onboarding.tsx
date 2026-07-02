import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Rocket, Shield, Coins, ArrowRight, Check } from "lucide-react";

const slides = [
  {
    icon: <Rocket size={64} className="text-brand-primary" />,
    title: "Welcome to Cloud Mine",
    desc: "The most advanced and secure cryptocurrency cloud mining platform.",
  },
  {
    icon: <Coins size={64} className="text-brand-gold" />,
    title: "Earn Daily Profits",
    desc: "Deposit XRP, activate mining plans, and earn up to 5% daily returns automatically.",
  },
  {
    icon: <Shield size={64} className="text-green-500" />,
    title: "Secure & Verified",
    desc: "2FA authentication, anti-fraud systems, and real-time withdrawals keep your funds secure.",
  },
];

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("has_seen_onboarding")) {
      setShow(true);
    }
  }, []);

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("has_seen_onboarding", "true");
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col p-6 items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -20 }}
          className="flex-1 flex flex-col items-center justify-center text-center max-w-sm"
        >
          <div className="w-40 h-40 mb-8 rounded-full bg-gradient-to-tr from-brand-primary/20 to-brand-primary/5 flex items-center justify-center border border-brand-primary/20 relative">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20 bg-brand-primary"
              style={{ animationDuration: "3s" }}
            />
            {slides[step].icon}
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            {slides[step].title}
          </h2>
          <p className="text-text-muted text-lg">{slides[step].desc}</p>
        </motion.div>
      </AnimatePresence>

      <div className="w-full max-w-sm mb-12 flex justify-between items-center">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-brand-primary" : "w-2 bg-white/20"}`}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          className="bg-brand-primary text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-brand-primary/90 transition-transform active:scale-95 shadow-[0_0_20px_rgba(205,255,100,0.4)]"
        >
          {step === slides.length - 1 ? (
            <>
              Get Started <Check size={18} />
            </>
          ) : (
            <>
              Next <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

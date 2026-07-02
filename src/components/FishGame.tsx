import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { store } from '../lib/store';
import { useTranslation } from '../contexts/TranslationContext';
import { playSound } from '../lib/audio';

interface Fish {
  id: number;
  type: 'small' | 'medium' | 'big' | 'shark';
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  active: boolean;
  multiplier: number;
  color: string;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetId: number | null;
  active: boolean;
  cost: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export default function FishGame({ betAmount, onError }: { betAmount: string; onError: (msg: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [isAutoShoot, setIsAutoShoot] = useState(false);
  const [autoTarget, setAutoTarget] = useState<number | null>(null);

  // Simulation state refs to avoid closure stale state in rAF
  const fishesRef = useRef<Fish[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const lastTimeRef = useRef<number>(0);
  const nextFishIdRef = useRef<number>(0);
  const nextBulletIdRef = useRef<number>(0);
  const nextTextIdRef = useRef<number>(0);
  const autoFireTimerRef = useRef<number>(0);

  const FISH_TYPES = {
    small: { width: 30, height: 20, multiplier: 2, color: '#34D399', speed: 100, spawnRate: 0.02 },
    medium: { width: 50, height: 30, multiplier: 5, color: '#FBBF24', speed: 70, spawnRate: 0.008 },
    big: { width: 80, height: 50, multiplier: 10, color: '#F87171', speed: 50, spawnRate: 0.003 },
    shark: { width: 120, height: 60, multiplier: 50, color: '#A78BFA', speed: 30, spawnRate: 0.0005 },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas internal size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 400; // Fixed height logic

    const spawnFish = () => {
      Object.entries(FISH_TYPES).forEach(([type, config]) => {
        if (Math.random() < config.spawnRate) {
          const side = Math.random() > 0.5 ? 1 : -1;
          const y = 50 + Math.random() * (canvas.height - 100);
          fishesRef.current.push({
            id: nextFishIdRef.current++,
            type: type as any,
            x: side === 1 ? -config.width : canvas.width + config.width,
            y,
            vx: side * config.speed * (0.8 + Math.random() * 0.4),
            vy: (Math.random() - 0.5) * 20,
            width: config.width,
            height: config.height,
            active: true,
            multiplier: config.multiplier,
            color: config.color
          });
        }
      });
    };

    const update = (dt: number) => {
      // Update fishes
      fishesRef.current.forEach(f => {
        if (!f.active) return;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        
        // Bounce off top/bottom
        if (f.y < 20 || f.y > canvas.height - 20) f.vy *= -1;

        // Despawn
        if ((f.vx > 0 && f.x > canvas.width + 200) || (f.vx < 0 && f.x < -200)) {
           f.active = false;
        }
      });

      // Cleanup inactive fishes
      fishesRef.current = fishesRef.current.filter(f => f.active);

      // Update bullets
      bulletsRef.current.forEach(b => {
        if (!b.active) return;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Check bounds
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
          b.active = false;
          return;
        }

        // Check collisions with active fish
        for (let i = 0; i < fishesRef.current.length; i++) {
          const f = fishesRef.current[i];
          if (!f.active) continue;

          // Simple AABB collision
          if (b.x > f.x - f.width/2 && b.x < f.x + f.width/2 &&
              b.y > f.y - f.height/2 && b.y < f.y + f.height/2) {
             
             b.active = false;
             handleHit(f, b);
             break;
          }
        }
      });

      bulletsRef.current = bulletsRef.current.filter(b => b.active);

      // Update texts
      textsRef.current.forEach(t => {
        t.y -= 20 * dt;
        t.life -= dt;
      });
      textsRef.current = textsRef.current.filter(t => t.life > 0);
    };

    const handleHit = async (fish: Fish, bullet: Bullet) => {
       const u = store.getState().users.find(u => u.id === user?.id);
       if (!u) return;
       
       const winRate = store.getState().gameFishWinRate ?? 48;
       // RTP calculated from winRate (e.g., 48 => 96% RTP)
       const rtp = Math.max(0.01, (winRate / 50) * 0.96); 
       
       // Probability to catch = Base RTP / Multiplier
       const catchProb = rtp / fish.multiplier;

       if (Math.random() < catchProb) {
          // Caught!
          fish.active = false;
          playSound('win');
          const winAmount = bullet.cost * fish.multiplier;
          
          textsRef.current.push({
            id: nextTextIdRef.current++,
            x: fish.x,
            y: fish.y,
            text: `+${winAmount.toFixed(2)}`,
            color: '#00FF00',
            life: 2.0
          });

          await store.updateUser(u.id, {
            balance: store.getState().users.find(usr => usr.id === u.id)!.balance + winAmount
          });
          
          await store.addTransaction({
            userId: u.id,
            type: 'reward' as any,
            amount: winAmount,
            status: 'completed',
            description: `Caught ${fish.type} fish (${fish.multiplier}x)`
          });
       } else {
         // Missed (armor flash maybe? keeping simple)
          playSound('tick');
          textsRef.current.push({
            id: nextTextIdRef.current++,
            x: fish.x,
            y: fish.y,
            text: `Miss`,
            color: '#FFFFFF88',
            life: 0.5
          });
       }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw fishes
      fishesRef.current.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        if (f.type === 'shark') {
            ctx.ellipse(f.x, f.y, f.width/2, f.height/2, 0, 0, Math.PI * 2);
        } else {
            ctx.ellipse(f.x, f.y, f.width/2, f.height/2, 0, 0, Math.PI * 2);
        }
        ctx.fill();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(f.x + (f.vx > 0 ? f.width/4 : -f.width/4), f.y - Math.min(5, f.height/4), Math.max(2, f.height/8), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(f.x + (f.vx > 0 ? f.width/4 + 1 : -f.width/4 - 1), f.y - Math.min(5, f.height/4), Math.max(1, f.height/16), 0, Math.PI * 2);
        ctx.fill();

        // Multiplier label
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${f.multiplier}x`, f.x, f.y + 4);
      });

      // Draw bullets
      bulletsRef.current.forEach(b => {
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00FFFF';
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Turret at bottom center
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(canvas.width / 2 - 20, canvas.height - 30, 40, 30);
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height - 30, 20, Math.PI, 0);
      ctx.fill();

      // Draw Texts
      textsRef.current.forEach(t => {
         ctx.fillStyle = t.color;
         ctx.font = 'bold 20px Arial';
         ctx.textAlign = 'center';
         ctx.globalAlpha = Math.min(1, t.life * 2);
         ctx.fillText(t.text, t.x, t.y);
         ctx.globalAlpha = 1.0;
      });
    };

    let animationFrameId: number;
    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      spawnFish();
      update(dt);
      draw(ctx);

      // Auto fire logic
      if (isAutoShoot && user) {
         if (time - autoFireTimerRef.current > 500) { // Shoot every 500ms
             autoFireTimerRef.current = time;
             let target = fishesRef.current.find(f => f.id === autoTarget && f.active);
             if (!target) {
                 // pick random target
                 if (fishesRef.current.length > 0) {
                     target = fishesRef.current[Math.floor(Math.random() * fishesRef.current.length)];
                     setAutoTarget(target.id);
                 }
             }

             if (target) {
                 triggerShoot(target.x, target.y);
             }
         }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [user, isAutoShoot, autoTarget]);


  const triggerShoot = async (tx: number, ty: number) => {
     if (!user) return;
     const amount = Number(betAmount);
     if (isNaN(amount) || amount <= 0) {
       onError(t('Enter valid bet'));
       return;
     }

     const u = store.getState().users.find(usr => usr.id === user.id);
     if (!u || u.balance < amount) {
       onError(t('Insufficient balance'));
       setIsAutoShoot(false); // Stop auto shooting if poor
       return;
     }

     const canvas = canvasRef.current;
     if (!canvas) return;

     onError(''); // clear errors

     playSound('bet');

     // Deduct balance
     await store.updateUser(user.id, {
        balance: u.balance - amount
     });
     
     // Optionally log transaction for every shot, but that might be spammy for db.
     // For a real app, you'd batch this. Skipping individual transaction logging for shots to save spam, 
     // but we can add a simple silent log.
     store.addTransaction({
        userId: user.id,
        type: 'transfer',
        amount: -amount,
        status: 'completed',
        description: `Shot fired`
     }).catch(e => console.error("Could not log tx:", e));

     const startX = canvas.width / 2;
     const startY = canvas.height - 30;

     const dx = tx - startX;
     const dy = ty - startY;
     const dist = Math.sqrt(dx*dx + dy*dy);

     const speed = 600;

     bulletsRef.current.push({
         id: nextBulletIdRef.current++,
         x: startX,
         y: startY,
         vx: (dx/dist) * speed,
         vy: (dy/dist) * speed,
         targetId: null,
         active: true,
         cost: amount
     });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
     if (isAutoShoot) {
        // Find clicked fish to set target
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (let i = 0; i < fishesRef.current.length; i++) {
           const f = fishesRef.current[i];
           if (x > f.x - f.width/2 && x < f.x + f.width/2 &&
               y > f.y - f.height/2 && y < f.y + f.height/2) {
               setAutoTarget(f.id);
               return;
           }
        }
        setAutoTarget(null); // Clicked background, clear target
        return;
     }

     const rect = canvasRef.current?.getBoundingClientRect();
     if (!rect) return;
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     
     triggerShoot(x, y);
  };

  return (
    <div className="bg-[#0f172a] rounded-3xl border border-[#1e293b] p-4 relative overflow-hidden shadow-2xl">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
         <button 
           onClick={() => setIsAutoShoot(!isAutoShoot)}
           className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${isAutoShoot ? 'bg-[#FF007A] text-white shadow-[0_0_15px_rgba(255,0,122,0.5)]' : 'bg-black/50 text-white border border-white/20'}`}
         >
            {isAutoShoot ? t('STOP AUTO') : t('AUTO AIM')}
         </button>
      </div>

      <canvas 
         ref={canvasRef}
         onClick={handleCanvasClick}
         className="w-full h-[400px] cursor-crosshair rounded-xl border border-white/10"
         style={{ background: 'radial-gradient(circle at center, #1e3a8a 0%, #020617 100%)' }}
      />
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center pointer-events-none">
          {t('Click to shoot. Adjust bet amount below.')}
      </div>
    </div>
  );
}

// src/lib/audio.ts

let audioCtx: AudioContext | null = null;
let unlocked = false;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const unlockAudio = () => {
  if (unlocked) return;
  initAudio();
  if (audioCtx && audioCtx.state !== 'suspended') {
    unlocked = true;
    if (!isMuted) startBackgroundMusic();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  }
};

if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
}

let isMuted = true; // Permanently muted

if (typeof window !== 'undefined') {
  // Always muted, ignoring localStorage
  isMuted = true;
}

export const getIsMuted = () => true;

let bgMusicOsc: OscillatorNode | null = null;
let bgMusicGain: GainNode | null = null;
let bgLfo: OscillatorNode | null = null;

export const startBackgroundMusic = () => {
  return; // Permanently disabled
};

export const stopBackgroundMusic = () => {
  if (bgMusicOsc) {
    try {
      bgMusicOsc.stop();
      bgMusicOsc.disconnect();
      bgLfo?.stop();
      bgLfo?.disconnect();
      bgMusicGain?.disconnect();
    } catch(e) {}
    bgMusicOsc = null;
    bgLfo = null;
    bgMusicGain = null;
  }
};

export const toggleMute = () => {
  return true; // Always muted
};

export const playSound = (type: 'bet' | 'win' | 'lose' | 'spin' | 'flip' | 'crash' | 'tick' | 'fly') => {
  return; // Permanently disabled
};

export const playCoinSound = () => playSound('tick');
export const playSuccessSound = () => playSound('win');

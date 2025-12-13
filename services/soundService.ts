
// Simple synthesizer for game sound effects using Web Audio API
// This avoids external asset dependencies and ensures zero latency

let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime = 0, vol = 0.1) => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  
  // Envelope
  gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.01); // Attack
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration); // Decay

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
};

export const playSound = (type: 'correct' | 'wrong' | 'start' | 'win' | 'lose') => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;

  switch (type) {
    case 'correct':
      // High pitch "Ding" - Clean Sine
      playTone(600, 'sine', 0.1, 0, 0.1);
      playTone(800, 'sine', 0.3, 0.05, 0.1);
      break;
    
    case 'wrong':
      // Low thud/buzz - Sawtooth for grit
      playTone(150, 'sawtooth', 0.15, 0, 0.1);
      playTone(100, 'sawtooth', 0.15, 0.05, 0.1);
      break;

    case 'start':
      // Rising swipe
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      break;

    case 'win':
      // Victory Fanfare - Square waves for "8-bit coin/win" feel
      // Rapid Arpeggio Up
      playTone(523.25, 'square', 0.1, 0.0, 0.05); // C5
      playTone(659.25, 'square', 0.1, 0.06, 0.05); // E5
      playTone(783.99, 'square', 0.1, 0.12, 0.05); // G5
      
      // The "Ta-da!" Chord
      playTone(1046.50, 'triangle', 0.6, 0.18, 0.15); // C6 (Melody)
      playTone(523.25, 'triangle', 0.6, 0.18, 0.15); // C5 (Bass)
      playTone(1318.51, 'sine', 0.5, 0.22, 0.1); // E6 (Sparkle)
      break;

    case 'lose':
      // Descending minor/dissonant
      playTone(300, 'triangle', 0.3, 0, 0.15);
      playTone(280, 'triangle', 0.3, 0.2, 0.15);
      playTone(180, 'sawtooth', 0.8, 0.4, 0.15);
      break;
  }
};


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
  
  gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
};

export const playSound = (type: 'correct' | 'wrong' | 'start' | 'win' | 'lose') => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  switch (type) {
    case 'correct':
      // High pitch "Ding"
      playTone(600, 'sine', 0.1, 0, 0.1);
      playTone(800, 'sine', 0.3, 0.05, 0.1);
      break;
    
    case 'wrong':
      // Low thud/buzz
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
      // Major Arpeggio
      playTone(523.25, 'sine', 0.2, 0, 0.1); // C5
      playTone(659.25, 'sine', 0.2, 0.1, 0.1); // E5
      playTone(783.99, 'sine', 0.2, 0.2, 0.1); // G5
      playTone(1046.50, 'sine', 0.6, 0.3, 0.1); // C6
      break;

    case 'lose':
      // Descending minor/dissonant
      playTone(300, 'triangle', 0.3, 0, 0.15);
      playTone(280, 'triangle', 0.3, 0.2, 0.15);
      playTone(200, 'sawtooth', 0.8, 0.4, 0.15);
      break;
  }
};

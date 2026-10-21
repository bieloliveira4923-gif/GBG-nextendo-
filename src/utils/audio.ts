/**
 * Audio manager playing the authentic Game Builder Garage sound effects
 * (atras, confirmar, copiar, hover, tick) with Web Audio fallback.
 */

let isAudioEnabled = true;

// Load mute preference
try {
  const saved = localStorage.getItem('gbg_sound_enabled');
  if (saved !== null) {
    isAudioEnabled = saved === 'true';
  }
} catch {
  isAudioEnabled = true;
}

export function setSoundEnabled(enabled: boolean) {
  isAudioEnabled = enabled;
  try {
    localStorage.setItem('gbg_sound_enabled', String(enabled));
  } catch {
    // ignore
  }
}

export function getSoundEnabled(): boolean {
  return isAudioEnabled;
}

// Preloaded Audio elements for zero-latency response
const soundUrls = {
  hover: '/sounds/hover.wav',
  tick: '/sounds/tick.wav',
  confirmar: '/sounds/confirmar.wav',
  copiar: '/sounds/copiar.wav',
  atras: '/sounds/atras.wav',
};

// Web Audio API Synthesizer fallback if audio tags fail
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function synthTone(freq: number, duration: number, type: OscillatorType = 'square', gain = 0.08, delay = 0) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const startTime = ctx.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gainNode.gain.setValueAtTime(gain, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // ignore
  }
}

// Play sound helper with cloned audio to allow overlapping sounds
function playAudioFile(url: string, fallback: () => void, volume = 0.7) {
  if (!isAudioEnabled) return;

  try {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(() => {
      // Fallback to synthesized web audio if browser blocks audio file
      fallback();
    });
  } catch {
    fallback();
  }
}

export const sfx = {
  hover: () => {
    playAudioFile(soundUrls.hover, () => {
      synthTone(1200, 0.03, 'sine', 0.04);
    }, 0.25);
  },

  tick: () => {
    playAudioFile(soundUrls.tick, () => {
      synthTone(900, 0.04, 'square', 0.05);
    }, 0.4);
  },

  confirmar: () => {
    playAudioFile(soundUrls.confirmar, () => {
      synthTone(660, 0.08, 'square', 0.07);
      synthTone(990, 0.14, 'square', 0.07, 0.08);
    }, 0.7);
  },

  copiar: () => {
    playAudioFile(soundUrls.copiar, () => {
      synthTone(784, 0.08, 'triangle', 0.09);
      synthTone(1047, 0.08, 'triangle', 0.09, 0.08);
      synthTone(1319, 0.18, 'triangle', 0.09, 0.16);
    }, 0.8);
  },

  atras: () => {
    playAudioFile(soundUrls.atras, () => {
      synthTone(520, 0.08, 'square', 0.07);
      synthTone(390, 0.12, 'square', 0.07, 0.08);
    }, 0.6);
  },
};

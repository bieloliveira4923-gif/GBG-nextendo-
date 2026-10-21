/**
 * Audio manager playing authentic Game Builder Garage sound effects
 * (atras, confirmar, copiar, hover, tick) with Web Audio fallback.
 * Built to be completely error-free and resilient in all browser environments.
 */

let isAudioEnabled = true;
let hasUserInteracted = false;

// Listen for first interaction to unlock audio playback safely
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    hasUserInteracted = true;
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
}

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

// Audio file paths (located in /public/sounds/)
const SOUND_PATHS: Record<string, string> = {
  hover: '/sounds/hover.wav',
  tick: '/sounds/tick.wav',
  confirmar: '/sounds/confirmar.wav',
  copiar: '/sounds/copiar.wav',
  atras: '/sounds/atras.wav',
};

// Cached HTMLAudioElement instances for immediate playback
const audioCache: Record<string, HTMLAudioElement[]> = {
  hover: [],
  tick: [],
  confirmar: [],
  copiar: [],
  atras: [],
};

// Safe Web Audio API Synthesizer fallback
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended' && hasUserInteracted) {
      audioCtx.resume().catch(() => {});
    }
  } catch {
    return null;
  }
  return audioCtx;
}

function synthTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.06,
  delay = 0
) {
  if (!isAudioEnabled || !hasUserInteracted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const startTime = ctx.currentTime + Math.max(0, delay);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gainNode.gain.setValueAtTime(Math.max(0.0001, gain), startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // Safe silent fallback
  }
}

// Play sound helper with audio pool and error suppression
let lastHoverTime = 0;

function playAudioSafe(key: string, volume = 0.7, fallback?: () => void) {
  if (!isAudioEnabled) return;

  // Rate-limit hover sound to avoid audio stutter
  if (key === 'hover') {
    const now = Date.now();
    if (now - lastHoverTime < 60) return;
    lastHoverTime = now;
  }

  // If user hasn't clicked anywhere yet, don't trigger unhandled play errors
  if (!hasUserInteracted) {
    return;
  }

  try {
    const pool = audioCache[key] || [];
    let audio = pool.find((a) => a.paused || a.ended);

    if (!audio) {
      audio = new Audio(SOUND_PATHS[key]);
      pool.push(audio);
      if (pool.length > 5) {
        pool.shift();
      }
    }

    audio.volume = Math.min(1, Math.max(0, volume));
    audio.currentTime = 0;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Suppress browser autoplay / interruption errors safely
        if (fallback) fallback();
      });
    }
  } catch {
    if (fallback) fallback();
  }
}

export const sfx = {
  hover: () => {
    playAudioSafe('hover', 0.25, () => {
      synthTone(1200, 0.025, 'sine', 0.03);
    });
  },

  tick: () => {
    playAudioSafe('tick', 0.4, () => {
      synthTone(900, 0.04, 'square', 0.05);
    });
  },

  confirmar: () => {
    hasUserInteracted = true;
    playAudioSafe('confirmar', 0.8, () => {
      synthTone(660, 0.08, 'square', 0.06);
      synthTone(990, 0.14, 'square', 0.06, 0.08);
    });
  },

  copiar: () => {
    hasUserInteracted = true;
    playAudioSafe('copiar', 0.85, () => {
      synthTone(784, 0.08, 'triangle', 0.08);
      synthTone(1047, 0.08, 'triangle', 0.08, 0.08);
      synthTone(1319, 0.16, 'triangle', 0.08, 0.16);
    });
  },

  atras: () => {
    hasUserInteracted = true;
    playAudioSafe('atras', 0.7, () => {
      synthTone(520, 0.08, 'square', 0.06);
      synthTone(390, 0.12, 'square', 0.06, 0.08);
    });
  },
};

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

type ToneKind = 'sine' | 'triangle';

let audioReady = false;
const cache = new Map<string, Audio.Sound>();

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function encodeWav(
  freqs: number[],
  durationMs: number,
  kind: ToneKind,
  volume: number
): string {
  const sampleRate = 22050;
  const totalSamples = Math.floor((durationMs / 1000) * sampleRate);
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const amp = 0.22 * clamp01(volume);
  const noteLen = Math.floor(totalSamples / Math.max(1, freqs.length));
  for (let i = 0; i < totalSamples; i++) {
    const noteIndex = Math.min(freqs.length - 1, Math.floor(i / noteLen));
    const freq = freqs[noteIndex];
    const t = i / sampleRate;
    const phase = 2 * Math.PI * freq * t;
    let sample =
      kind === 'sine' ? Math.sin(phase) : 2 * Math.abs(2 * ((t * freq) % 1) - 1) - 1;
    // short envelope
    const local = i % noteLen;
    const attack = Math.min(1, local / 80);
    const release = Math.min(1, (noteLen - local) / 200);
    sample *= amp * attack * release;
    const s = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, (s * 32767) | 0, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  if (typeof globalThis.btoa === 'function') return globalThis.btoa(binary);
  // Fallback without Node Buffer (RN / Hermes)
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += chars[(triple >> 18) & 63];
    out += chars[(triple >> 12) & 63];
    out += i + 1 < bytes.length ? chars[(triple >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? chars[triple & 63] : '=';
  }
  return out;
}

async function ensureAudio() {
  if (audioReady) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    // ignore on web
  }
  audioReady = true;
}

async function playTone(
  key: string,
  freqs: number[],
  durationMs: number,
  kind: ToneKind,
  volumePct: number
) {
  const vol = clamp01(volumePct / 100);
  if (vol <= 0.001) return;
  await ensureAudio();
  const cacheKey = `${key}:${Math.round(vol * 20)}`;
  try {
    let sound = cache.get(cacheKey);
    if (!sound) {
      const b64 = encodeWav(freqs, durationMs, kind, vol);
      const created = await Audio.Sound.createAsync(
        { uri: `data:audio/wav;base64,${b64}` },
        { shouldPlay: false, volume: 1 }
      );
      sound = created.sound;
      cache.set(cacheKey, sound);
    }
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // audio optional
  }
}

const MUSIC_NOTES = [196, 220, 262, 294, 330, 294, 262, 220];
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicIndex = 0;
let musicVolume = 50;

export const SoundBus = {
  setMusicVolume(v: number) {
    musicVolume = v;
  },

  async startMusic(volumePct: number) {
    this.stopMusic();
    musicVolume = volumePct;
    musicIndex = 0;
    musicTimer = setInterval(() => {
      const note = MUSIC_NOTES[musicIndex % MUSIC_NOTES.length];
      musicIndex += 1;
      void playTone(`m${note}`, [note], 600, 'sine', musicVolume * 0.35);
    }, 600);
  },

  stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  },

  click(v: number) {
    void playTone('click', [700], 30, 'triangle', v);
  },
  roll(v: number) {
    void playTone('roll', [420, 520, 640], 180, 'triangle', v);
  },
  step(v: number) {
    void playTone('step', [660], 40, 'triangle', v);
  },
  gem(v: number) {
    void playTone('gem', [880, 1320], 160, 'triangle', v);
  },
  power(v: number) {
    void playTone('power', [740, 990], 160, 'triangle', v);
  },
  damage(v: number) {
    void playTone('damage', [220], 160, 'triangle', v);
  },
  gloom(v: number) {
    void playTone('gloom', [190], 80, 'triangle', v);
  },
  switch(v: number) {
    void playTone('switch', [520, 390], 140, 'triangle', v);
  },
  win(v: number) {
    void playTone('win', [523, 659, 784, 1046], 420, 'triangle', v);
  },
  lose(v: number) {
    void playTone('lose', [330, 247], 260, 'triangle', v);
  },
  warp(v: number) {
    void playTone('warp', [300, 600, 1200], 220, 'triangle', v);
  },
};

export async function haptic(
  kind: 'step' | 'roll' | 'damage' | 'win',
  enabled: boolean
) {
  if (!enabled) return;
  try {
    if (kind === 'step') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (kind === 'roll') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (kind === 'damage') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    if (kind === 'win') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // web / unsupported
  }
}

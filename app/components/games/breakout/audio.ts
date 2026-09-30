import { SOUND_BOUNCE_SRC, SOUND_BREAK_SRC } from "./constants";

export type Sound = "bounce" | "break";

export interface GameAudio {
  play: (sound: Sound) => void;
  toggleMute: () => void;
  isMuted: () => boolean;
  dispose: () => void;
}

// Efectos del juego. Los navegadores bloquean el audio hasta la primera interacción del
// usuario: `play()` rechaza la promesa y aquí se captura para que nunca llegue a consola.
export function createAudio(): GameAudio {
  const sources: Record<Sound, HTMLAudioElement> = {
    bounce: new Audio(SOUND_BOUNCE_SRC),
    break: new Audio(SOUND_BREAK_SRC),
  };
  const active = new Set<HTMLAudioElement>();
  let muted = false;

  return {
    play(sound) {
      if (muted) return;
      // Clon por reproducción para que varios efectos puedan solaparse, como en el original
      const clip = sources[sound].cloneNode() as HTMLAudioElement;
      active.add(clip);
      clip.addEventListener("ended", () => active.delete(clip), { once: true });
      clip.play().catch(() => active.delete(clip));
    },
    toggleMute() {
      muted = !muted;
      if (muted) {
        active.forEach((clip) => clip.pause());
        active.clear();
      }
    },
    isMuted: () => muted,
    dispose() {
      active.forEach((clip) => clip.pause());
      active.clear();
    },
  };
}

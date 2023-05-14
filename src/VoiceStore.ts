import { writable } from 'svelte/store';

export interface Voice {
  voice_name: string;
  voice_id: string;
  voice_preview: string;
  voice_category: string
}

export const voices = writable<Voice[]>([]);

export const addVoice = (voice: Voice) => {
  voices.update((voices) => [...voices, voice]);
};

export const removeVoice = (voice: Voice) => {
  voices.update((voices) => voices.filter((v) => v.voice_id !== voice.voice_id));
};

export const clearVoices = () => {
  voices.set([]);
};

export const selectedVoice = writable<Voice | null>(null);

export const setSelectedVoice = (voice: Voice) => {
  selectedVoice.set(voice);
};

export const setSelectedVoiceByName = (voice_name: string) => {
  voices.update((voices) => {
    const voice = voices.find((v) => v.voice_name === voice_name);
    if (voice) {
      setSelectedVoice(voice);
    }
    return voices;
  });
};

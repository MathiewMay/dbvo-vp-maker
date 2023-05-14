import { writable } from 'svelte/store';

export const files = writable<string[]>([]);

export const addFile = (file: string) => {
  files.update((files) => [...files, file]);
};

export const removeFile = (file: string) => {
  files.update((files) => files.filter((f) => f !== file));
};

export const clearFiles = () => {
  files.set([]);
};
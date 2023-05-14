import { writable } from "svelte/store";
import type { Model } from "./lib/Interfaces/Models";

// Define a writable store for the models
export const modelsStore = writable<Model[]>([]);

// Define a function to push a model to the store
export function pushModel(model: Model) {
  modelsStore.update(models => {
    models.push(model);
    return models;
  });
}

// Define a function to get all models from the store
export function getAllModels(): Model[] {
  let models: Model[] = [];
  modelsStore.subscribe(m => {
    models = m;
  });
  return models;
}

export const selectedModelStore = writable<Model | null>(null);

export function setSelectedModelByName(name: string): void {
  modelsStore.update((models) => {
    const model = models.find((model) => model.name === name);
    selectedModelStore.set(model || null);
    return models;
  });
}
import { writable, derived, type Writable } from 'svelte/store';

export class MessageBoard {
  public messages: Writable<string[]>;

  constructor(initialMessages: string[] = []) {
    this.messages = writable(initialMessages);
  }

  public message(message: string): void {
    this.messages.update((messages) => [...messages, message]);
  }

  public clear(): void {
    this.messages.set([]);
  }
}
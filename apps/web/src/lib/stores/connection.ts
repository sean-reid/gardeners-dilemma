import { writable } from 'svelte/store';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export const connectionStatus = writable<ConnectionStatus>('disconnected');
export const roomCode = writable<string | null>(null);

export interface Vine {
  id: number;
  value: number;
  alive: boolean;
}

export type PlayerSlot = 1 | 2;

export interface HarvestResult {
  vineId: number;
  playerId: PlayerSlot;
  value: number;
}

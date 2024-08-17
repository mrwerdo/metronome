import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface _CfKV {
  key: string;
  value: Buffer | null;
}

export interface Bars {
  bpm: number;
  delay: number;
  id: Generated<number>;
  name: string;
  numberOfBars: number;
  songId: string;
  subBeats: number;
  timeSignature: number;
}

export interface Songs {
  createdAt: Generated<string>;
  favorite: Generated<number>;
  id: string;
  instrument: string;
  name: string;
}

export interface DB {
  _cf_KV: _CfKV;
  Bars: Bars;
  Songs: Songs;
}

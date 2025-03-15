import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface _CfKV {
  key: string;
  value: Buffer | null;
}

export interface Songs {
  document: string;
  id: Generated<string>;
}

export interface DB {
  _cf_KV: _CfKV;
  Songs: Songs;
}

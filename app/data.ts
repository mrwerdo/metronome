import { matchSorter } from "match-sorter";
// @ts-expect-error - no types, but it's a tiny function
import sortBy from "sort-by";

import {
  Kysely,
  ParseJSONResultsPlugin,
  sql
} from 'kysely';

import { DB as Database } from './db.d';
import { D1Dialect } from "kysely-d1";
import { songTypeSchema } from "./schema";


export type SectionMutation = {
  id?: number
  name?: string
  bpm?: number
  numberOfBeats?: number
  numberOfSubBeats?: number
  delay?: number
  numberOfBars?: number
}

export type SectionRecord = SectionMutation & {
  id: number,
  createdAt: string;
  name: string
  bpm: number
  numberOfBeats: number
  numberOfSubBeats: number
  delay: number
  numberOfBars: number
}

export type SongMutation = {
  id?: string
  name?: string
  favorite?: boolean
  instrument?: string
  sections?: Array<SectionMutation>
}

export type SongRecord = SongMutation & {
  id: string
  createdAt: string
  // sections: Array<SectionRecord>
}

export type SectionType = {
  id: number,
  name: string
  bpm: number
  numberOfBeats: number
  numberOfSubBeats: number
  delay: number
  numberOfBars: number
}

export type SongType = {
  id: string
  name: string
  favorite: boolean
  instrument: string
  createdAt: string
  sections: Array<SectionType>
}

function createKyselyDatabase(db: D1Database): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: db }),
    plugins: [new ParseJSONResultsPlugin()]
  })
}

export async function getSongs(db: D1Database, query?: string | null) {
  const kdb = createKyselyDatabase(db);
  const result = await kdb.selectFrom('Songs').select((eb) => [
     'Songs.id',
     'Songs.document'
  ]).execute().then(rows => {
    return rows.map((row) => {
      const result = songTypeSchema.parse(row.document) as SongType;
      return result;
    });
  });

  if (!query) {
    return result.sort(sortBy("name", "createdAt"));
  }

  return matchSorter(result, query, {
    keys: ["name", "instrument"],
  })
  .sort(sortBy("name", "createdAt"));
}

export async function createSong(db: D1Database) {
  const song: SongType = {
    // @ts-expect-error since this is the only time id should be undefined.
    id: undefined,
    createdAt: new Date().toISOString(),
    favorite: false,
    instrument: 'Violin',
    name: 'My New Song',
    sections: [
      {
        id: 0,
        bpm: 120,
        delay: 0,
        name: 'Section 1',
        numberOfBars: 10,
        numberOfSubBeats: 1,
        numberOfBeats: 4
      }
    ]
  };
  const kdb = createKyselyDatabase(db)
  const query = await kdb.insertInto('Songs').values(
    {
      document: JSON.stringify(song)
    }
  ).returningAll().executeTakeFirstOrThrow()
  return query
}

export async function getSong(db: D1Database, id: string): Promise<SongType> {
  const kdb = createKyselyDatabase(db);
  const query = await kdb.selectFrom('Songs').where('id', '=', id).select((eb) => [
     'Songs.id',
     'Songs.document'
  ]).executeTakeFirstOrThrow().then(row => {
    const result = songTypeSchema.parse(row.document) as SongType;
    return result;
  });
  return query
}

export async function updateSong(db: D1Database, id: string, updates: SongType) {
  songTypeSchema["~validate"](updates);
  const kdb = createKyselyDatabase(db)
  const result = await kdb.updateTable('Songs').set(
    {
      document: JSON.stringify(updates)
    }
  ).where('Songs.id', '=', id).returningAll().executeTakeFirstOrThrow()
  return result;
}

export async function setFavorite(db: D1Database, id: string, favorite: boolean): Promise<SongType> {
  const kdb = createKyselyDatabase(db);
  const favoriteText = favorite ? 'true' : 'false';
  const result = await kdb
    .updateTable('Songs')
    .set({
      document: sql`json_set(document, "$.favorite", json(${favoriteText}))`
    })
    .where('Songs.id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();
  const value = songTypeSchema.parse(result.document) as SongType;
  return value;
}

export async function deleteSong(db: D1Database, id: string) {
  const kdb = createKyselyDatabase(db);
  await kdb.deleteFrom('Songs').where('Songs.id', '=', id).execute();
}

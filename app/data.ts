import { matchSorter } from "match-sorter";
// @ts-expect-error - no types, but it's a tiny function
import sortBy from "sort-by";

import {
  Kysely,
  ParseJSONResultsPlugin,
  sql
} from 'kysely';

import { DB as Database } from './db.d';
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/sqlite";
import { D1Dialect } from "kysely-d1";
import { songMutationSchema, songTypeSchema } from "./schema";


export type BarMutation = {
  id?: number
  name?: string
  bpm?: number
  timeSignature?: number
  subBeats?: number
  delay?: number
  numberOfBars?: number
}

export type BarRecord = BarMutation & {
  id: number,
  createdAt: string;
  name: string
  bpm: number
  timeSignature: number
  subBeats: number
  delay: number
  numberOfBars: number
}

export type SongMutation = {
  id?: string
  name?: string
  favorite?: boolean
  instrument?: string
  bars?: Array<BarMutation>
}

export type SongRecord = SongMutation & {
  id: string
  createdAt: string
  // bars: Array<BarRecord>
}

export type BarType = {
  id: number,
  name: string
  bpm: number
  timeSignature: number
  subBeats: number
  delay: number
  numberOfBars: number
}

export type SongType = {
  id: string
  name: string
  favorite: boolean
  instrument: string
  createdAt: string
  bars: Array<BarType>
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
  const kdb = createKyselyDatabase(db)
  const query = await kdb.insertInto('Songs').values(
    {
      document: JSON.stringify({
        id: '0',
        createdAt: new Date().toISOString(),
        favorite: false,
        instrument: 'Violin',
        name: 'My New Song',
        bars: [
          {
            id: 0,
            bpm: 120,
            delay: 0,
            name: 'Section 1',
            numberOfBars: 10,
            subBeats: 1,
            timeSignature: 4
          }
        ]
      })
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

export async function addBar(db: D1Database, id: string, bar: BarType) {
  const kdb = createKyselyDatabase(db);
  const newBar = {
    ...bar
  }
  // newBar.songId = id;
  // const result = await kdb.insertInto('Bars').values(newBar).executeTakeFirstOrThrow()
  // return result;
}

export async function setBarsForSong(db: D1Database, songId: string, bars: Array<BarType>) {
  const kdb = createKyselyDatabase(db);
  // await kdb.deleteFrom('Bars').where('Bars.songId', '=', songId).execute()
  // await kdb.insertInto('Bars').values(bars.map((value, index) => { return { ...value, id: index } })).execute()
}


export async function deleteSong(db: D1Database, id: string) {
  const kdb = createKyselyDatabase(db);
  await kdb.deleteFrom('Songs').where('Songs.id', '=', id).execute();
}

const tempos = [
  {
    "name": "Larghissimo",
    "bpm_min": 0,
    "bpm_max": 24
  },
  {
    "name": "Grave",
    "bpm_min": 25,
    "bpm_max": 40
  },
  {
    "name": "Lento",
    "bpm_min": 40,
    "bpm_max": 60
  },
  {
    "name": "Largo",
    "bpm_min": 40,
    "bpm_max": 60
  },
  {
    "name": "Larghetto",
    "bpm_min": 60,
    "bpm_max": 66
  },
  {
    "name": "Adagio",
    "bpm_min": 66,
    "bpm_max": 76
  },
  {
    "name": "Andante",
    "bpm_min": 76,
    "bpm_max": 108
  },
  {
    "name": "Andantino",
    "bpm_min": 80,
    "bpm_max": 108
  },
  {
    "name": "Moderato",
    "bpm_min": 108,
    "bpm_max": 120
  },
  {
    "name": "Allegretto",
    "bpm_min": 112,
    "bpm_max": 120
  },
  {
    "name": "Allegro",
    "bpm_min": 120,
    "bpm_max": 156
  },
  {
    "name": "Vivace",
    "bpm_min": 156,
    "bpm_max": 176
  },
  {
    "name": "Presto",
    "bpm_min": 168,
    "bpm_max": 200
  },
  {
    "name": "Prestissimo",
    "bpm_min": 200,
    "bpm_max": null
  }
];
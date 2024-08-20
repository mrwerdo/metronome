import { matchSorter } from "match-sorter";
// @ts-expect-error - no types, but it's a tiny function
import sortBy from "sort-by";

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
  songId: string
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

import {
  Kysely,
  ParseJSONResultsPlugin
} from 'kysely';

import { DB as Database } from './db.d';
import { jsonArrayFrom } from "kysely/helpers/sqlite";
import { D1Dialect } from "kysely-d1";
import { songMutationSchema } from "./schema";

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
    'Songs.name',
    'Songs.createdAt',
    'Songs.favorite',
    'Songs.instrument',
    jsonArrayFrom(
      eb.selectFrom('Bars').select(
        [
          'Bars.id',
          'Bars.bpm',
          'Bars.delay',
          'Bars.name',
          'Bars.numberOfBars',
          'Bars.songId',
          'Bars.subBeats',
          'Bars.timeSignature',
      ]
      ).whereRef('Songs.id', '=', 'Bars.songId').orderBy('Bars.id')
    ).as('bars')
  ]).execute()

  if (!query) {
    return result.sort(sortBy("name", "createdAt"));
  }

  return matchSorter(result, query, {
    keys: ["name", "instrument"],
  })
  .sort(sortBy("name", "createdAt"));
}

// Thank's chatgpt...
function generateGUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createSong(db: D1Database) {
  const newGuid = generateGUID();

  const kdb = createKyselyDatabase(db)
  const query = await kdb.insertInto('Songs').values(
    {
      name: 'New Song',
      id: newGuid,
      instrument: 'Piano',
    }
  ).returningAll().executeTakeFirstOrThrow()
  return query
}

export async function getSong(db: D1Database, id: string): Promise<SongType> {
  const kdb = createKyselyDatabase(db);
  const query = await kdb.selectFrom('Songs').where('id', '=', id).select((eb) => [
    'Songs.id',
    'Songs.name',
    'Songs.createdAt',
    'Songs.favorite',
    'Songs.instrument',
    jsonArrayFrom(
      eb.selectFrom('Bars').select(
        [
          'Bars.id',
          'Bars.bpm',
          'Bars.delay',
          'Bars.name',
          'Bars.numberOfBars',
          'Bars.songId',
          'Bars.subBeats',
          'Bars.timeSignature',
      ]
      ).whereRef('Songs.id', '=', 'Bars.songId').orderBy('Bars.id')
    ).as('bars')
  ]).executeTakeFirstOrThrow()

  // No matter what library/system I use, there is some tiny stupidity like this!
  // @ts-ignore
  query.favorite = query.favorite !== 0 ? true : false
  // @ts-ignore
  return query
}

export async function updateSong(db: D1Database, id: string, updates: SongMutation) {
  const kdb = createKyselyDatabase(db)
  const data = songMutationSchema.parse(updates);
  const record = {
    ...data,
    favorite: updates.favorite ? 1 : 0
  }
  const result = await kdb.updateTable('Songs').set(
    record
  ).where('Songs.id', '=', id).returningAll().executeTakeFirstOrThrow()
  return result
}

export async function addBar(db: D1Database, id: string, bar: BarType) {
  const kdb = createKyselyDatabase(db);
  const newBar = {
    ...bar
  }
  newBar.songId = id;
  const result = await kdb.insertInto('Bars').values(newBar).executeTakeFirstOrThrow()
  return result;
}

export async function setBarsForSong(db: D1Database, songId: string, bars: Array<BarType>) {
  const kdb = createKyselyDatabase(db);
  await kdb.deleteFrom('Bars').where('Bars.songId', '=', songId).execute()
  await kdb.insertInto('Bars').values(bars.map((value, index) => { return { ...value, id: index } })).execute()
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
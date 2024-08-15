import { matchSorter } from "match-sorter";
// @ts-expect-error - no types, but it's a tiny function
import sortBy from "sort-by";
import invariant from "tiny-invariant";

export type BarMutation = {
  id?: number
  name?: string
  bpm?: number
  timeSignature?: [number, number]
  subBeats?: number
  delay?: number
  numberOfBars?: number
}

export type BarRecord = BarMutation & {
  id: number,
  createdAt: string;
  name: string
  bpm: number
  timeSignature: [number, number]
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

const metronomeDatabase = {
  records: {} as Record<string, SongRecord>,

  async getAll(): Promise<SongRecord[]> {
    return Object.keys(metronomeDatabase.records)
      .map((key) => metronomeDatabase.records[key])
      .sort(sortBy("-createdAt", "last"));
  },

  async get(id: string): Promise<SongRecord | null> {
    return metronomeDatabase.records[id] || null;
  },

  async create(values: SongMutation): Promise<SongRecord> {
    const id = values.id || Math.random().toString(36).substring(2, 9).toString();
    const createdAt = new Date().toISOString();
    const metronome = { id, createdAt, ...values };
    metronomeDatabase.records[id] = metronome;
    return metronome;
  },

  async set(id: string, values: SongMutation): Promise<SongRecord> {
    const contact = await metronomeDatabase.get(id);
    invariant(contact, `No metronome found for ${id}`);
    const updatedMetronome = { ...contact, ...values };
    metronomeDatabase.records[id] = updatedMetronome;
    return updatedMetronome;
  },

  destroy(id: string): null {
    delete metronomeDatabase.records[id];
    return null;
  },
};

export async function getMetronomes(query?: string | null) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  let metronome = await metronomeDatabase.getAll();
  if (query) {
    metronome = matchSorter(metronome, query, {
      keys: ["first", "last"],
    });
  }
  return metronome.sort(sortBy("last", "createdAt"));
}

export async function createEmptyMetronome() {
  const metronome = await metronomeDatabase.create({});
  return metronome;
}

export async function getMetronome(id: string) {
  return metronomeDatabase.get(id);
}

export async function updateMetronome(id: string, updates: SongMutation) {
  const metronome = await metronomeDatabase.get(id);
  if (!metronome) {
    throw new Error(`No metronome found for ${id}`);
  }
  await metronomeDatabase.set(id, { ...metronome, ...updates });
  return metronome;
}

export async function deleteMetronome(id: string) {
  metronomeDatabase.destroy(id);
}

const builtinMetronomes: Array<SongMutation> = [
  {
    name: 'Test Song',
    favorite: false,
    instrument: 'Piano',
    bars: [
      {
        id: 0,
        name: 'Allegro',
        bpm: 120,
        timeSignature: [4, 4],
        subBeats: 1,
        delay: 0,
        numberOfBars: 2
      },
      {
        id: 1,
        name: 'Larghetto',
        bpm: 60,
        timeSignature: [4, 4],
        subBeats: 4,
        delay: 500,
        numberOfBars: 2
      },
      {
        id: 2,
        name: 'Andantino',
        bpm: 80,
        timeSignature: [6, 8],
        subBeats: 3,
        delay: 0,
        numberOfBars: 2
      }
    ]
  }
];

builtinMetronomes.forEach(metronomeDatabase.create);

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
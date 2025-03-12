class NamedBpmRange {
  name: string;
  min: number;
  max: number;

  constructor(name: string, min: number, max: number) {
    this.name = name;
    this.min = min;
    this.max = max;
  }
}

export const tempos = [
  {
    "name": "Larghissimo",
    "min": 0,
    "max": 24
  },
  {
    "name": "Grave",
    "min": 25,
    "max": 39
  },
  {
    "name": "Large/Lento",
    "min": 40,
    "max": 59
  },
  {
    "name": "Larghetto",
    "min": 60,
    "max": 65
  },
  {
    "name": "Adagio",
    "min": 66,
    "max": 75
  },
  {
    "name": "Andantino/Andante",
    "min": 76,
    "max": 107
  },
  {
    "name": "Moderato",
    "min": 108,
    "max": 111, 
  },
  {
    "name": "Allegretto",
    "min": 112,
    "max": 119
  },
  {
    "name": "Allegro",
    "min": 120,
    "max": 155
  },
  {
    "name": "Vivace",
    "min": 156,
    "max": 175
  },
  {
    "name": "Presto",
    "min": 176,
    "max": 199
  },
  {
    "name": "Prestissimo",
    "min": 200,
    "max": 300
  }
].map(value => new NamedBpmRange(value['name'], value['min'], value['max']));

export function tempoGivenBpm(bpm: number): NamedBpmRange {
  for (let tempo of tempos) {
    if (tempo['min'] <= bpm && tempo['max'] !== null && bpm <= tempo['max']) {
      return tempo;
    }
  }
  return tempos[tempos.length];
}
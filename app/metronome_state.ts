import { Sampler, Loop, getTransport } from "tone";
import studio_01 from "../tones/studio-01.mp3?url";
import studio_02 from "../tones/studio-02.mp3?url";
import coffee_shop from "../tones/coffee-shop.mp3?url";
import { BarMutation, BarRecord, SongRecord } from "./data";
import { TransportClass } from "tone/build/esm/core/clock/Transport";
import { useSyncExternalStore } from "react";

let externalMetronomeState: MetronomeState | null;

function subscribe(): ((callback: () => void) => (() => void)) {
  let isServerSideRendered = false;
  try {
    if (externalMetronomeState === null || externalMetronomeState === undefined) {
      externalMetronomeState = new MetronomeState(null, 4, 3, null, null);
      isServerSideRendered = true;
      return externalMetronomeState.subscribe.bind(externalMetronomeState);
    } else {
      return externalMetronomeState.subscribe.bind(externalMetronomeState);
    }
  } catch (error) {
    console.log('Assuming server side rendering.');
    externalMetronomeState = null;
    isServerSideRendered = false;
    return (callback: () => void) => {
      return () => {
        // cleanup is not necessary
      };
    };
  }
}

const getSnapshotServerResult = {
  counter: 0,
  numberOfBeats: 4,
  numberOfSubBeats: 3,
  currentBeat: 0,
  currentSubBeat: 0,
  isPlaying: false,
  isLoaded: false,
  totalCountUntilStartOfBar: 0,
  bar: null,
  toggleIsPlaying: () => { }
};

function getSnapshot(): () => MetronomeStateSnapshot {
  if (externalMetronomeState !== null) {
    return externalMetronomeState.snapshot.bind(externalMetronomeState);
  } else {
    return () => {
      return getSnapshotServerResult;
    };
  }
}

export function useMetronomeState(song: SongRecord): MetronomeStateSnapshot {
  // This feels wierd?
  if (externalMetronomeState !== null && externalMetronomeState !== undefined) {
    externalMetronomeState.setSong(song);
  }

  return useSyncExternalStore<MetronomeStateSnapshot>(subscribe(), getSnapshot(), getSnapshot())
}

export interface MetronomeStateSnapshot {
  counter: number
  numberOfBeats: number
  numberOfSubBeats: number
  currentBeat: number
  currentSubBeat: number
  isPlaying: boolean
  isLoaded: boolean
  totalCountUntilStartOfBar: number
  bar: BarMutation | null
  toggleIsPlaying: () => void
}

export class MetronomeState {
  private _counter: number
  private song: SongRecord | null
  private transport: TransportClass
  private loop?: Loop
  private sampler?: Sampler
  private _numberOfBeats: number
  private _numberOfSubBeats: number
  private _totalCountUntilStartOfBar: number
  private _isLoaded: boolean
  private setCounter2: React.Dispatch<React.SetStateAction<number>> | null
  private setLoaded: React.Dispatch<React.SetStateAction<boolean>> | null
  private setNumberOfBeats?: React.Dispatch<React.SetStateAction<number>>
  private setNumberOfSubBeats?: React.Dispatch<React.SetStateAction<number>>
  private listeners: Array<() => void> = [];
  private _snapshot: MetronomeStateSnapshot = {
    counter: 0,
    numberOfBeats: 0,
    numberOfSubBeats: 0,
    currentBeat: 0,
    currentSubBeat: 0,
    isPlaying: false,
    isLoaded: false,
    totalCountUntilStartOfBar: 0,
    bar: null,
    toggleIsPlaying: () => {
      this.toggleIsPlaying();
    }
  };

  public setSong(song: SongRecord) {
    if (this.song !== song) {
      // update?
    }
    this.song = song;
  }

  public get numberOfBeats(): number {
    return this._numberOfBeats;
  }

  public get numberOfSubBeats(): number {
    return this._numberOfSubBeats;
  }

  public get currentBeat(): number {
    const counter = this._counter - this._totalCountUntilStartOfBar
    return (~~(counter / this._numberOfSubBeats)) % this._numberOfBeats;
  }

  public get currentSubBeat(): number {
    const counter = this._counter - this._totalCountUntilStartOfBar
    return counter % this._numberOfSubBeats;
  }

  public get isPlaying(): boolean {
    if (this.transport.state === "started") {
      return true;
    } else {
      return false;
    }
  }

  public get counter(): number {
    return this._counter;
  }

  public get isLoaded(): boolean {
    return this._isLoaded
  }

  constructor(
    song: SongRecord | null,
    numberOfBeats: number,
    numberOfSubBeats: number,
    setCounter: React.Dispatch<React.SetStateAction<number>> | null,
    setLoaded: React.Dispatch<React.SetStateAction<boolean>> | null,
    setNumberOfBeats?: React.Dispatch<React.SetStateAction<number>>,
    setNumberOfSubBeats?: React.Dispatch<React.SetStateAction<number>>
  ) {
    this._isLoaded = false
    this._counter = 0
    this.song = song
    this._numberOfBeats = numberOfBeats;
    this._numberOfSubBeats = numberOfSubBeats;
    this._totalCountUntilStartOfBar = 0;
    this.transport = getTransport();
    this.setCounter2 = setCounter
    this.setLoaded = setLoaded
    this.setNumberOfBeats = setNumberOfBeats
    this.setNumberOfSubBeats = setNumberOfSubBeats
    this.loop = new Loop((time) => { this.next(time) }, `4n`);
    this.sampler = new Sampler(
      {
        "A1": studio_01,
        "A2": studio_02,
        "B1": coffee_shop
      },
      {
        onload: () => {
          this.didLoadSampler();
        },
        onerror: (error) => {
          console.log(`an error occured while loading samples: ${error}`)
        }
      }
    ).toDestination();

    this.sampler.volume.value = 10;

    this.updateVariables(0);
    this.updateSnapshot();
    this.updateListeners();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    }
  }

  public snapshot(): MetronomeStateSnapshot {
    return this._snapshot
  }

  private updateListeners() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private next(time: number) {
    this._counter += 1;
    if (this.updateVariables(time)) {
      return;
    }
    if (this.currentBeat === 0 && this.currentSubBeat === 0) {
      this.sampler?.triggerAttack("A1", time);
    } else if (this.currentSubBeat === 0 && this._numberOfSubBeats > 1) {
      this.sampler?.triggerAttack("B1", time);
    } else {
      this.sampler?.triggerAttack("A2", time);
    }
    console.log(`setCounter(${this._counter}, ${this.currentBeat}, ${this.currentSubBeat})`);
    this.setCounter(this._counter);
  }

  private currentBar(): [BarMutation, number] | null {
    if (this.song === null || this.song?.bars === undefined) {
      return null;
    }

    let index = 0;
    let count = 0;
    for (; index < this.song.bars.length; index += 1) {
      const bar: BarRecord = this.song.bars[index] as BarRecord
      const lengthOfBarInCounter = bar.numberOfBars * bar.timeSignature * bar.subBeats
      if (count <= this._counter && this._counter < count + lengthOfBarInCounter) {
        break;
      } else {
        count = count + lengthOfBarInCounter
      }
    }

    if (index === this.song.bars.length) {
      return null;
    }

    return [this.song.bars[index], count];
  }

  private updateVariables(time: number): boolean {
    const [bar, count] = this.currentBar() ?? [null, 0];

    if (bar === null && this.song !== null) {
      this._counter -= 1;
      this.stop(time);
      console.log("stopping");
      return true;
    }

    if (bar === null) {
      return true;
    }

    this._totalCountUntilStartOfBar = count;
    this._numberOfBeats = bar.timeSignature ?? 0;
    this._numberOfSubBeats = bar.subBeats ?? 0;
    try {
      // Adjust BPM to apply to the beat instead of the subbeat
      this.transport.bpm.setValueAtTime((bar.bpm ?? 0) * this._numberOfSubBeats, time);
    } catch {
      // Handle error
    }
    return false;
  }

  private setNumberOfBeatsAndSubBeats(beats: number, subbeats: number) {
    this._numberOfBeats = beats
    this._numberOfSubBeats = subbeats
    const previous = this.loop;
    previous?.stop(0);
    this.loop = new Loop((time) => { this.next(time) }, `4n`);

    if (this.transport.state === "started") {
      this.loop.start(0);
      console.log(`state.current.counter = 0`)
      this._counter = 0;
      console.log(`setCounter(${this._counter % (this._numberOfBeats * this._numberOfSubBeats)})`)
      this.setCounter(this._counter);
    }
  }

  public toggleIsPlaying() {
    if (this.transport.state === "started") {
      this.stop()
      this.setCounter(-2);
    } else {
      this.start()
      this.setCounter(-1);
    }
  }

  public start(time: number = 0) {
    this.transport.start();
    this.loop?.start();
    console.log(this.transport)
    console.log(this.loop)
    console.log(`state.current.counter = numberOfBeats * numberOfSubBeats - 1`)
    this._counter = -1;
    this._totalCountUntilStartOfBar = 0;
  }

  public stop(time: number = 0) {
    this.transport.stop(time);
    this.transport.seconds = 0;
    this.loop?.stop(time);
  }

  private updateSnapshot() {
    this._snapshot = {
      counter: this.counter,
      numberOfBeats: this.numberOfBeats,
      numberOfSubBeats: this.numberOfSubBeats,
      currentBeat: this.currentBeat,
      currentSubBeat: this.currentSubBeat,
      isPlaying: this.isPlaying,
      isLoaded: this.isLoaded,
      totalCountUntilStartOfBar: this._totalCountUntilStartOfBar,
      bar: this.currentBar()?.[0] ?? null,
      toggleIsPlaying: () => {
        this.toggleIsPlaying();
      }
    }
  }

  private setCounter(c: number) {
    if (this.setCounter2 !== null) {
      this.setCounter2(c);
    }
    this.updateSnapshot();
    this.updateListeners();
  }

  private didLoadSampler() {
    if (this.setLoaded !== null) {
      this.setLoaded(true);
    }
    this._isLoaded = true;
    this.updateSnapshot();
  }

  public setVolume(volume: number) {
    if (this.sampler) {
      this.sampler.volume.value = volume;
    }
  }
}

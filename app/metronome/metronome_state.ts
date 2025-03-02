import { Sampler, Loop, getTransport } from "tone";
import studio_01 from "~/assets/tones/studio-01.mp3?url";
import studio_02 from "~/assets/tones/studio-02.mp3?url";
import coffee_shop from "~/assets/tones/coffee-shop.mp3?url";
import { SongType } from "~/data";
import { TransportClass } from "tone/build/esm/core/clock/Transport";
import { useSyncExternalStore } from "react";
import { Controller, Index, Song } from "./controller";

let externalMetronomeState: MetronomeState | null;
let stateCache: { [key: string]: _State } = {};

export interface MetronomeStateSnapshot {
  index: Index
  isPlaying: boolean
  isLoaded: boolean
  metronome: MetronomeState | null;
  setIndex(index: Index): void
  toggleIsPlaying: () => void
  setVolume(volume: number): void
}

class _State implements MetronomeStateSnapshot {
  public index: Index
  public isPlaying: boolean
  public isLoaded: boolean
  public metronome: MetronomeState | null;
  public controller: Controller;

  constructor(
    index: Index,
    isPlaying: boolean,
    isLoaded: boolean,
    metronome: MetronomeState | null,
    controller: Controller,
  ) {
    this.index = index;
    this.isPlaying = isPlaying;
    this.isLoaded = isLoaded;
    this.metronome = metronome;
    this.controller = controller;
  }

  public setIndex(index: Index) {
    this.metronome?.setIndex(index);
  }

  public toggleIsPlaying() {
    this.metronome?.toggleIsPlaying();
  }

  public setVolume(volume: number): void {
    this.metronome?.setVolume(volume);
  }
}

function subscribe(): ((callback: () => void) => (() => void)) {
  if (externalMetronomeState !== null && externalMetronomeState !== undefined) {
    return externalMetronomeState?.subscribe.bind(externalMetronomeState);
  } else {
    console.log('Assuming server side rendering.');
    externalMetronomeState = null;
    return (callback: () => void) => {
      return () => {
        // cleanup is not necessary
      };
    };
  }
}

export function useMetronomeState(song: SongType): MetronomeStateSnapshot {
  // This feels wierd?
  if (externalMetronomeState !== null && externalMetronomeState !== undefined) {
    externalMetronomeState.setSong(song);
  } else {
    try {
      externalMetronomeState = new MetronomeState(song);
    } catch (error) {
      externalMetronomeState = null;
    }
  }
  return useSyncExternalStore<MetronomeStateSnapshot>(subscribe(), () => {
    if (externalMetronomeState !== null) {
      return externalMetronomeState.snapshot();
    } else {
      throw new Error('MetronomeState is not initialized');
    }
  }, () => {
    if (song.id in stateCache) {
      return stateCache[song.id];
    } else {
      const controller = new Controller(song);
      stateCache[song.id] = new _State(controller.song.firstIndex(), false, false, null, controller);
      return stateCache[song.id];
    }
  });
}

export class MetronomeState {
  private index: Index = new Index(-1, -1, -1, -1, -1, -1, -1);
  private state: _State;
  private _isLoaded: boolean
  private listeners: Array<() => void> = [];
  private transport: TransportClass
  private loop?: Loop
  private sampler?: Sampler

  private set _counter(value: number) {
    this.index = this.song.indexGivenCounter(value);
  }

  public controller: Controller

  public setIndex(index: Index) {
    this.index = index;
    this.updateVariables(0);
    this.updateUserInterface();
  }

  public setSong(song: SongType) {
    this.controller.song = new Song(song);
  }

  private get song(): Song {
    return this.controller.song;
  }

  public get numberOfBeats(): number {
    return this.song.sections[this.index.section].numberOfBeats;
  }

  public get numberOfSubBeats(): number {
    return this.song.sections[this.index.section].numberOfSubBeats;
  }

  public get totalCountUntilStartOfBar(): number {
    return this.index.sectionStartIndex;
  }

  public get currentBeat(): number {
    return this.index.beat;
  }

  public get currentSubBeat(): number {
    return this.index.subBeat;
  }

  public get isPlaying(): boolean {
    if (this.transport.state === "started") {
      return true;
    } else {
      return false;
    }
  }

  public get counter(): number {
    return this.index.counter;
  }

  public get isLoaded(): boolean {
    return this._isLoaded
  }

  constructor(
    song: SongType
  ) {
    this.controller = new Controller(song);
    this._isLoaded = false
    this._counter = 0
    this.transport = getTransport();
    this.loop = new Loop((time) => { this.update(time) }, `4n`);
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
    this.state = new _State(
      this.index,
      this.isPlaying,
      this.isLoaded,
      this,
      this.controller,
    );

    this.updateVariables(0);
    this.updateUserInterface();
  }

  private update(time: number) {
    this.updateUserInterface();
    if (this.currentBeat === 0 && this.currentSubBeat === 0) {
      this.sampler?.triggerAttack("A1", time);
    } else if (this.currentSubBeat === 0 && this.numberOfSubBeats > 1) {
      this.sampler?.triggerAttack("B1", time);
    } else {
      this.sampler?.triggerAttack("A2", time);
    }
    console.log(`update(${this._counter}, ${this.currentBeat}, ${this.currentSubBeat})`);
    this.index = this.song.indexNextSubBeat(this.index);
    if (this.updateVariables(time)) {
      return;
    }
  }

  private updateVariables(time: number): boolean {
    if (this.index.counter === -1) {
      this.stop(time);
      console.log('stopping');
      return true;
    }
    const bpm = this.song.sections[this.index.section].bpm;

    try {
      // Adjust BPM to apply to the beat instead of the subbeat
      this.transport.bpm.setValueAtTime(bpm * this.numberOfSubBeats, time);
    } catch {
      // Handle error
    }
    return false;
  }

  public toggleIsPlaying() {
    if (this.transport.state === "started") {
      this.stop()
    } else {
      this.start()
    }
    this.updateUserInterface();
  }

  public start(time: number = 0) {
    this.transport.start();
    this.loop?.start();
    console.log(this.transport)
    console.log(this.loop)
    console.log(`state.current.counter = numberOfBeats * numberOfSubBeats - 1`)
  }

  public stop(time: number = 0) {
    this.transport.stop(time);
    this.transport.seconds = 0;
    this.loop?.stop(time);
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
    return this.state;
  }

  private updateUserInterface() {
    this.state = new _State(
      this.index,
      this.isPlaying,
      this.isLoaded,
      this,
      this.controller,
    );

    for (const subscriberCallback of this.listeners) {
      subscriberCallback();
    }
  }

  private didLoadSampler() {
    this._isLoaded = true;
    this.updateUserInterface();
  }

  public setVolume(volume: number) {
    if (this.sampler) {
      this.sampler.volume.value = volume;
    }
  }
}

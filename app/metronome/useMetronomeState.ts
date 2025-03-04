import { Sampler, Loop, getTransport } from "tone";
import studio_01 from "~/assets/tones/studio-01.mp3?url";
import studio_02 from "~/assets/tones/studio-02.mp3?url";
import coffee_shop from "~/assets/tones/coffee-shop.mp3?url";
import { SongType } from "~/data";
import { TransportClass } from "tone/build/esm/core/clock/Transport";
import { useEffect, useSyncExternalStore } from "react";
import { Controller, Index, Song } from "./controller";

export interface MetronomeStateSnapshot {
  index: Index
  isPlaying: boolean
  isLoaded: boolean
  metronome: MetronomeDevice | null;
  controller: Controller;
  setIndex(index: Index): void
  toggleIsPlaying: () => void
  setVolume(volume: number): void
}

class _State implements MetronomeStateSnapshot {
  public index: Index
  public isPlaying: boolean
  public isLoaded: boolean
  public metronome: MetronomeDevice | null;
  public controller: Controller;

  constructor(
    index: Index,
    isPlaying: boolean,
    isLoaded: boolean,
    metronome: MetronomeDevice | null,
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

let externalMetronomeDevice: MetronomeDevice | null;
let stateCache: { [key: string]: _State } = {};

export function useMetronomeState(song: SongType): MetronomeStateSnapshot {
  if (externalMetronomeDevice === null || externalMetronomeDevice === undefined) {
    try {
      externalMetronomeDevice = new MetronomeDevice(song);
    } catch (error) {
      externalMetronomeDevice = null;
    }
  }

  if (externalMetronomeDevice !== null && externalMetronomeDevice !== undefined) {
    useEffect(() => {
      externalMetronomeDevice?.setSong(song);
    }, [song]);
  }

  return useSyncExternalStore<MetronomeStateSnapshot>((callback) => {
    if (externalMetronomeDevice !== null && externalMetronomeDevice !== undefined) {
      return externalMetronomeDevice.subscribe(callback);
    } else {
      // Server side rendering...
      return () => { };
    }
  }, () => {
    if (externalMetronomeDevice !== null) {
      return externalMetronomeDevice.snapshot();
    } else {
      throw new Error('MetronomeState is not initialized');
    }
  }, () => {
    if (song.id in stateCache) {
      return stateCache[song.id];
    } else {
      const controller = new Controller(song);
      stateCache[song.id] = new _State(controller.firstIndex(), false, false, null, controller);
      return stateCache[song.id];
    }
  });
}

class MetronomeDevice {
  private state: _State;
  private isLoaded: boolean
  private listeners: Array<() => void> = [];
  private transport: TransportClass
  private loop: Loop
  private sampler: Sampler
  private controller: Controller

  private get isPlaying(): boolean {
    if (this.transport.state === "started") {
      return true;
    } else {
      return false;
    }
  }

  constructor(song: SongType) {
    this.controller = new Controller(song);
    this.isLoaded = false
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
          this.isLoaded = true;
          this.updateUserInterface();
        },
        onerror: (error) => {
          console.log(`an error occured while loading samples: ${error}`)
        }
      }
    ).toDestination();

    this.sampler.volume.value = 10;
    this.state = new _State(
      this.controller.currentIndex,
      this.isPlaying,
      this.isLoaded,
      this,
      this.controller,
    );

    this.updateVariables(0);
    this.updateUserInterface();
  }

  private update(time: number) {
    // todo: some timing problem with starting and finishing the song
    const section = this.controller.currentSection();
    if (!section) {
      return;
    }
    if (this.controller.currentIndex.beat === 0 && this.controller.currentIndex.subBeat === 0) {
      this.sampler.triggerAttack("A1", time);
    } else if (this.controller.currentIndex.subBeat === 0 && section.numberOfSubBeats > 1) {
      this.sampler.triggerAttack("B1", time);
    } else {
      this.sampler.triggerAttack("A2", time);
    }
    if (this.updateVariables(time)) {
      return;
    }
    this.updateUserInterface();
    this.controller.next();
  }

  private updateVariables(time: number): boolean {
    if (this.controller.currentIndex.isNotAnIndex()) {
      this.stop(time);
      console.log('stopping');
      return true;
    }
    const section = this.controller.currentSection();
    if (section) {
      this.transport.bpm.setValueAtTime(section.bpm * section.numberOfSubBeats, time);
    }
    return false;
  }

  private updateUserInterface() {
    this.state = new _State(
      this.controller.currentIndex.copy(),
      this.isPlaying,
      this.isLoaded,
      this,
      this.controller,
    );

    for (const subscriberCallback of this.listeners) {
      subscriberCallback();
    }
  }

  public setIndex(index: Index) {
    this.controller.currentIndex = index;
    this.updateVariables(0);
    this.updateUserInterface();
  }

  public setSong(song: SongType) {
    this.controller = new Controller(song);
    this.updateUserInterface();
  }

  public setVolume(volume: number) {
    if (this.sampler) {
      this.sampler.volume.value = volume;
    }
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
    this.transport.start(time);
    this.loop.start(time);
  }

  public stop(time: number = 0) {
    this.transport.stop(time);
    this.transport.seconds = 0;
    this.loop.stop(time);
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
}

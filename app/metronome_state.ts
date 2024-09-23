import { Sampler, Loop, getTransport } from "tone";
import studio_01 from "../tones/studio-01.mp3?url";
import studio_02 from "../tones/studio-02.mp3?url";
import coffee_shop from "../tones/coffee-shop.mp3?url";
import { BarRecord, SongRecord } from "./data";
import { TransportClass } from "tone/build/esm/core/clock/Transport";


export class MetronomeState {
  counter: number
  song: SongRecord
  transport: TransportClass
  loop?: Loop
  sampler?: Sampler
  numberOfBeats: number
  numberOfSubBeats: number
  totalCountUntilStartOfBar: number
  setCounter: React.Dispatch<React.SetStateAction<number>>
  setLoaded: React.Dispatch<React.SetStateAction<boolean>>
  setNumberOfBeats?: React.Dispatch<React.SetStateAction<number>>
  setNumberOfSubBeats?: React.Dispatch<React.SetStateAction<number>>

  currentBeat(): number {
    const counter = this.counter - this.totalCountUntilStartOfBar
    return (~~(counter / this.numberOfSubBeats)) % this.numberOfBeats;
  }

  currentSubBeat(): number {
    const counter = this.counter - this.totalCountUntilStartOfBar
    return counter % this.numberOfSubBeats;
  }

  isPlaying(): boolean {
    if (this.transport.state === "started") {
      return true;
    } else {
      return false;
    }
  }

  constructor(song: SongRecord,
    numberOfBeats: number,
    numberOfSubBeats: number,
    setCounter: React.Dispatch<React.SetStateAction<number>>,
    setLoaded: React.Dispatch<React.SetStateAction<boolean>>,
    setNumberOfBeats?: React.Dispatch<React.SetStateAction<number>>,
    setNumberOfSubBeats?: React.Dispatch<React.SetStateAction<number>>
  ) {
    this.counter = 0
    this.song = song
    this.numberOfBeats = numberOfBeats;
    this.numberOfSubBeats = numberOfSubBeats;
    this.totalCountUntilStartOfBar = 0;
    this.transport = getTransport();
    this.setCounter = setCounter
    this.setLoaded = setLoaded
    this.setNumberOfBeats = setNumberOfBeats
    this.setNumberOfSubBeats = setNumberOfSubBeats
    try {
      this.loop = new Loop((time) => { this.next(time) }, `4n`);
      this.sampler = new Sampler(
        {
          "A1": studio_01,
          "A2": studio_02,
          "B1": coffee_shop
        },
        {
          onload: () => {
            setLoaded(true);
          },
          onerror: (error) => {
            console.log(`an error occured while loading samples: ${error}`)
          }
        }
      ).toDestination();
    } catch {
      console.log('not loading sampler ond loop')
    }
    this.updateVariables(0);
  }

  next(time: number) {
    this.counter += 1;
    if (this.updateVariables(time)) {
      return
    }
    if (this.currentBeat() === 0 && this.currentSubBeat() === 0) {
      this.sampler?.triggerAttack("A1", time);
    } else if (this.currentSubBeat() === 0 && this.numberOfSubBeats > 1) {
      this.sampler?.triggerAttack("B1", time);
    } else {
      this.sampler?.triggerAttack("A2", time);
    }
    console.log(`setCounter(${this.counter}, ${this.currentBeat()}, ${this.currentSubBeat()})`)
    this.setCounter(this.counter);
  }

  updateVariables(time: number): boolean {
    if (this.song.bars === undefined) {
      return true;
    }

    let index = 0;
    let count = 0;
    for (; index < this.song.bars.length; index += 1) {
      const bar: BarRecord = this.song.bars[index] as BarRecord
      const lengthOfBarInCounter = bar.numberOfBars * bar.timeSignature * bar.subBeats
      if (count <= this.counter && this.counter < count + lengthOfBarInCounter) {
        break;
      } else {
        count = count + lengthOfBarInCounter
      }
    }

    if (index === this.song.bars.length) {
      this.counter -= 1;
      this.stop(time);
      console.log("stopping");
      return true;
    }

    const bar = this.song.bars[index]
    this.totalCountUntilStartOfBar = count;
    this.numberOfBeats = (bar.timeSignature ? bar.timeSignature : 0)
    this.numberOfSubBeats = (bar.subBeats ?? 0)
    try {
      this.transport.bpm.setValueAtTime(bar.bpm ?? 0, time)
    } catch {

    }
    return false;
  }

  setNumberOfBeatsAndSubBeats(beats: number, subbeats: number) {
    this.numberOfBeats = beats
    this.numberOfSubBeats = subbeats
    const previous = this.loop;
    previous?.stop(0);
    this.loop = new Loop((time) => { this.next(time) }, `4n`);

    if (this.transport.state === "started") {
      this.loop.start(0);
      console.log(`state.current.counter = 0`)
      this.counter = 0;
      console.log(`setCounter(${this.counter % (this.numberOfBeats * this.numberOfSubBeats)})`)
      this.setCounter(this.counter);
    }
  }

  toggleIsPlaying() {
    if (this.transport.state === "started") {
      this.stop()
      this.setCounter(-2);
    } else {
      this.start()
      this.setCounter(-1);
    }
  }

  start(time: number = 0) {
    this.transport.start();
    this.loop?.start();
    console.log(this.transport)
    console.log(this.loop)
    console.log(`state.current.counter = numberOfBeats * numberOfSubBeats - 1`)
    this.counter = -1;
    this.totalCountUntilStartOfBar = 0;
  }

  stop(time: number = 0) {
    this.transport.stop(time);
    this.transport.seconds = 0;
    this.loop?.stop(time);
  }
}

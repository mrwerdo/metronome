import { useState, useRef, useEffect, createRef, KeyboardEvent } from "react";
import { Sampler, Loop, getTransport } from "tone";
import studio_01 from "../tones/studio-01.mp3?url";
import studio_02 from "../tones/studio-02.mp3?url";
import coffee_shop from "../tones/coffee-shop.mp3?url";
import { BarRecord, SongRecord } from "./data";
import { TransportClass } from "tone/build/esm/core/clock/Transport";

class MetronomeState {
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
      console.log("returned");
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

// https://coolors.co/091540-7692ff-abd2fa-3d518c-1b2cc1
// #091540
// #7692FF
// #ABD2FA
// #3D518C
// #1B2CC1

export const MetronomeStandalone = () => {
  const [counter, setCounter] = useState(0);
  const [isLoaded, setLoaded] = useState(false);
  const state = useRef<MetronomeState | null>(null)
  useEffect(() => {
    const song: SongRecord = {
      id: '0',
      createdAt: '2024-08-20 16:06:00T1000',
      favorite: false,
      instrument: 'unknown',
      name: 'Hidden',
      bars: [
        {
          id: 0,
          bpm: 120,
          delay: 0,
          name: 'Hidden',
          numberOfBars: 9999,
          subBeats: 1,
          timeSignature: 4
        }
      ]
    }
    console.log('useEffect')
    state.current = new MetronomeState(song, 4, 3, setCounter, setLoaded);
    // return () => {
    //   // state.current?.stop()
    // }
  }, [])
  const handleClick = () => {
    console.log("handle")
    state.current?.toggleIsPlaying();
    console.log(state.current?.transport.state);
  }

  console.log('rendering')
  console.log(state.current?.transport.state);

  return <>
    <MetronomeCounterInternal
      startStopEvent={handleClick}
      counter={state.current?.counter ?? 0}
      isLoaded={isLoaded}
      numberOfBeats={state.current?.numberOfBeats ?? null}
      numberOfSubBeats={state.current?.numberOfSubBeats ?? null}
      currentBeat={state.current?.currentBeat() ?? null}
      currentSubBeat={state.current?.currentSubBeat() ?? null}
      isPlaying={state.current?.isPlaying() ?? null}
    />
  </>
}

export const MetronomeCounter = ({ song }: { song: SongRecord }) => {

  const [counter, setCounter] = useState(0);
  const [isLoaded, setLoaded] = useState(false);

  const state = useRef<MetronomeState | null>(null)
  useEffect(() => {
    state.current = new MetronomeState(song, 4, 3, setCounter, setLoaded);
    return () => {
      state.current?.stop()
    }
  }, [song])

  const handleClick = () => {
    state.current?.toggleIsPlaying();
  }

  return <>
    <MetronomeCounterInternal
      startStopEvent={handleClick}
      counter={state.current?.counter ?? 0}
      isLoaded={isLoaded}
      numberOfBeats={state.current?.numberOfBeats ?? null}
      numberOfSubBeats={state.current?.numberOfSubBeats ?? null}
      currentBeat={state.current?.currentBeat() ?? null}
      currentSubBeat={state.current?.currentSubBeat() ?? null}
      isPlaying={state.current?.isPlaying() ?? null}
    />
  </>
}

interface MetronomeCounterInternalProps {
  startStopEvent: () => void
  counter: number | null
  isLoaded: boolean 
  numberOfBeats: number | null
  numberOfSubBeats: number | null
  currentBeat: number | null
  currentSubBeat: number | null
  isPlaying: boolean | null
}

function MetronomeCounterInternal(props: MetronomeCounterInternalProps) {
  const numberOfBeats = props.numberOfBeats ?? 0
  const numberOfSubBeats = props.numberOfSubBeats ?? 0
  const div = createRef<HTMLDivElement>();

  useEffect(() => {
    div.current?.focus();
  }, []);

  const keypress = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      event.preventDefault();
      props.startStopEvent();
    }
  }

  const isPlaying = props.isPlaying ?? false;

  const currentBeat = props.currentBeat ?? 0;
  const subbeat = props.currentSubBeat ?? 0;

  return (
    <>
      <div ref={div} tabIndex={0} onKeyDown={keypress}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <p style={{ fontSize: 50 }}>{(currentBeat % numberOfBeats) + 1}.<span style={{ fontSize: 30 }}>{subbeat + 1}</span></p>
          <p style={{ fontSize: 15, marginLeft: 'auto' }}>Counter: {props.counter}</p>
          <p style={{ fontSize: 15, marginLeft: '1em' }}>Normalized Counter: {subbeat}</p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateRows: '1fr',
          gridTemplateColumns: `repeat(${numberOfBeats}, 1fr)`,
          gridAutoFlow: 'column'
        }}>
          {
            Array(numberOfBeats).fill(1).map((value, index) => {
              return <span key={index} style={{
                padding: '5px',
                textAlign: 'center',
                fontWeight: currentBeat === index ? 'bold' : 'normal',
                backgroundColor: currentBeat === index ? '#7692FF' : '#ABD2FA',
              }}>{index + 1}</span>
            })
          }
        </div>
        <div style={{
          display: 'grid',
          gridTemplateRows: '1fr',
          gridTemplateColumns: `repeat(${numberOfSubBeats}, 1fr)`,
          gridAutoFlow: 'column'
        }}>
          {
            Array(numberOfSubBeats).fill(1).map((value, index) => {
              return <span key={index} style={{
                padding: '5px',
                textAlign: 'center',
                fontWeight: subbeat === index ? 'bold' : 'normal',
                backgroundColor: subbeat === index ? '#7692FF' : '#ABD2FA',
              }}>{index + 1}</span>
            })
          }
        </div>
        <div>
          {/*
            No idea why this happens, but without suppressHydrationWarning, Firefox and Chrome 
            throw an error-warning which says that the server sent disabled="" and the client calculated
            disabled=true, but only after a second reload of the url. Is it due to client side state?
            Or is it due to the server sending disabled=""?
          */}
          <button disabled={!props.isLoaded} onClick={props.startStopEvent} suppressHydrationWarning>
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      </div>
    </>
  );
};